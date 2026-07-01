"""
Adapted from GenA11y ElementExtraction/extract_related_elements.py.

Changes vs. upstream:
  - Scope limited to SCs present in categories.json that GenA11y can cover.
  - Every element query also captures its XPath via xpath_utils.get_element_xpath.
  - Elements sent to the LLM are prefixed with [path: /html/...] labels.
  - Removed SCs not in scope: 1.3.3/4/5/6, 1.4.2/4/8/12, 2.2.x, 2.4.1/5/8, 2.5.x, 3.1.x.
  - Dropped heavy CV2 / imagehash dependencies; contrast screenshots use PIL only.
"""

import base64
import html as html_lib
import os
import re
import time
from io import BytesIO

from bs4 import BeautifulSoup
from PIL import Image
from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException, StaleElementReferenceException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

from consts import TEMP_FILE_FOLDER
from xpath_utils import extract_outer_html_and_xpath, format_with_xpath, get_element_xpath


# ---------------------------------------------------------------------------
# Driver setup
# ---------------------------------------------------------------------------

def make_driver(url: str) -> webdriver.Chrome:
    opts = Options()
    opts.add_argument('--headless')
    opts.add_argument('--no-sandbox')
    opts.add_argument('--disable-dev-shm-usage')
    driver = webdriver.Chrome(options=opts)
    driver.maximize_window()
    driver.get(url)
    _wait_for_load(driver)
    return driver


def _wait_for_load(driver, timeout=20):
    start = time.time()
    while True:
        ready = driver.execute_script(
            "return document.readyState === 'complete' && "
            "(!window.performance.timing || window.performance.timing.loadEventEnd > 0);"
        )
        if ready:
            return
        if time.time() - start > timeout:
            return  # proceed anyway
        time.sleep(0.4)


# ---------------------------------------------------------------------------
# Screenshot helpers
# ---------------------------------------------------------------------------

def _encode_image(path: str) -> str:
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')


def take_full_page_screenshot(driver, name='screenshot') -> str:
    """Save a full-page screenshot to TEMP_FILE_FOLDER and return base64."""
    path = os.path.join(TEMP_FILE_FOLDER, f'{name}.png')
    driver.save_screenshot(path)
    return _encode_image(path)


def _set_zoom(driver, pct: int):
    driver.execute_script(f"document.body.style.zoom='{pct}%'")


# ---------------------------------------------------------------------------
# Per-SC extraction functions
# Each returns data suitable for the corresponding detector function.
# Elements that have known XPaths are formatted with format_with_xpath().
# ---------------------------------------------------------------------------

def extract_page_title(driver) -> dict:
    """SC 2.4.2 — Page Titled."""
    title = driver.title or ''
    body_text = driver.find_element(By.TAG_NAME, 'body').text.replace('\n', ' ')
    portion = body_text[:int(len(body_text) * 0.5)]
    return {'title': title, 'portion_text': portion}


def extract_visual_elements(driver) -> dict:
    """SC 1.1.1 — Non-text Content. Returns dict of element-type → list of [path:] strings."""

    def _clean(s):
        return ' '.join(html_lib.unescape(s).replace('\\"', '"').split())

    def _elems(by_method, selector):
        found = []
        for el in driver.find_elements(by_method, selector):
            html, xpath = extract_outer_html_and_xpath(driver, el)
            if html:
                found.append(format_with_xpath(_clean(html), xpath))
        return found

    result = {
        'img_elements': _elems(By.TAG_NAME, 'img'),
        'svg_elements': _elems(By.TAG_NAME, 'svg'),
        'canvas_elements': _elems(By.TAG_NAME, 'canvas'),
        'input_image_elements': _elems(By.XPATH, "//input[@type='image']"),
        'img_role_elements': _elems(By.XPATH, "//*[@role='img']"),
        'audio_elements': _elems(By.TAG_NAME, 'audio'),
        'video_elements': _elems(By.TAG_NAME, 'video'),
        'object_elements': _elems(By.TAG_NAME, 'object'),
        'area_elements': _elems(By.XPATH, '//map//area'),
        'img_within_a': _elems(By.XPATH, '//a//img/..'),
    }
    return result


def extract_img_urls(driver) -> list:
    """SC 1.4.5 — Images of Text. Returns list of absolute image URLs."""
    current_url = driver.current_url
    base = current_url.rsplit('/', 1)[0] + '/' if '/' in current_url else current_url

    def _abs(src):
        if not src:
            return None
        if src.startswith(('http://', 'https://', 'data:')):
            return src
        return base + src.lstrip('/')

    srcs = set()
    for img in driver.find_elements(By.TAG_NAME, 'img'):
        s = img.get_attribute('src')
        if s:
            srcs.add(_abs(s))
    for el in driver.find_elements(By.CSS_SELECTOR, "input[type='image']"):
        s = el.get_attribute('src')
        if s:
            srcs.add(_abs(s))
    # CSS background images
    bg_urls = driver.execute_script("""
        return Array.from(document.querySelectorAll('*'))
            .map(el => window.getComputedStyle(el).backgroundImage)
            .filter(bg => bg && bg !== 'none' && bg.startsWith('url'))
            .map(bg => bg.slice(5, -2).replace(/[\"']/g, ''));
    """)
    for url in (bg_urls or []):
        srcs.add(_abs(url))
    return [s for s in srcs if s]


def extract_links(driver) -> list:
    """SC 2.4.4 — Link Purpose (In Context). Returns list of annotated HTML snippets."""
    results = []
    links = driver.find_elements(By.XPATH, '//a | //*[@role="link"]')
    for link in links:
        try:
            link_html, link_xpath = extract_outer_html_and_xpath(driver, link)
            if not link_html:
                continue
            # Include surrounding context (parent + prev/next sibling) as in upstream
            try:
                ancestor = link.find_element(By.XPATH,
                    './ancestor::table | ./ancestor::ul | ./ancestor::ol')
                context_html = ancestor.get_attribute('outerHTML') or link_html
            except Exception:
                try:
                    parent = link.find_element(By.XPATH, './..')
                    p_tag = parent.tag_name.lower()
                    if p_tag == 'body':
                        context_html = link_html
                    else:
                        p_html = _tag_without_children(driver, parent)
                        prev_sib = driver.execute_script(
                            "return arguments[0].previousElementSibling;", link)
                        next_sib = driver.execute_script(
                            "return arguments[0].nextElementSibling;", link)
                        prev_html = (prev_sib.get_attribute('outerHTML') or '') if prev_sib else ''
                        next_html = (next_sib.get_attribute('outerHTML') or '') if next_sib else ''
                        context_html = f'{p_html}{prev_html}{link_html}{next_html}</{p_tag}>'
                except Exception:
                    context_html = link_html
            snippet = context_html.replace('\n', '').replace('\t', '').strip()
            results.append(format_with_xpath(snippet, link_xpath))
        except StaleElementReferenceException:
            continue
    return results


def _tag_without_children(driver, element) -> str:
    """Return opening-tag-only HTML for a Selenium element."""
    try:
        tag = element.tag_name
        attrs = element.get_property('attributes') or []
        attr_str = ' '.join(f'{a["name"]}="{a["value"]}"' for a in attrs)
        text = element.text or ''
        return f'<{tag} {attr_str}>{text}</{tag}>'
    except Exception:
        return ''


def extract_contrast_elements(driver) -> tuple:
    """
    SC 1.4.3 — Contrast (Minimum).
    Returns (text_elements_list, bg_image_dict) where:
      text_elements_list: list of annotated HTML strings with inline color/font styles
      bg_image_dict: {annotated_html: base64_screenshot}
    """
    text_elements = []
    bg_image_dict = {}
    elements = driver.find_elements(By.XPATH, '//*')

    for el in elements:
        try:
            bg_color = driver.execute_script(
                "return window.getComputedStyle(arguments[0]).backgroundColor;", el)
            text_color = driver.execute_script(
                "return window.getComputedStyle(arguments[0]).color;", el)
            font_size = driver.execute_script(
                "return window.getComputedStyle(arguments[0]).fontSize;", el)
            font_weight = driver.execute_script(
                "return window.getComputedStyle(arguments[0]).fontWeight;", el)
            bg_image = driver.execute_script(
                "return window.getComputedStyle(arguments[0]).backgroundImage;", el)
            text_content = el.text.strip() if el.text else ''
            if not text_content:
                continue

            outer_html = el.get_attribute('outerHTML') or ''
            if '<body' in outer_html or '<head' in outer_html:
                continue

            xpath = get_element_xpath(driver, el)
            style = ''
            if text_color and text_color != 'rgb(0, 0, 0)':
                style += f'color: {text_color};'
            if font_size:
                style += f' font-size: {font_size};'
            if bg_color and bg_color not in ('rgba(0, 0, 0, 0)', 'transparent'):
                style += f' background-color: {bg_color};'
            if font_weight in ('bold', '700'):
                style += ' font-weight: bold;'

            # Parse just the opening tag via BS4
            soup = BeautifulSoup(outer_html, 'html.parser')
            tag = soup.find()
            if tag:
                tag.clear()
                new_html = str(soup)
            else:
                new_html = outer_html

            labeled = format_with_xpath(f'<span style="{style}">{new_html}</span>', xpath)

            if bg_image and bg_image != 'none':
                # Take a screenshot crop for this element
                try:
                    driver.execute_script("arguments[0].scrollIntoView();", el)
                    loc = el.location
                    size = el.size
                    shot_path = os.path.join(TEMP_FILE_FOLDER,
                        f'contrast_{loc["x"]}_{loc["y"]}.png')
                    driver.save_screenshot(shot_path)
                    img = Image.open(shot_path)
                    cropped = img.crop((
                        int(loc['x']), int(loc['y']),
                        int(loc['x'] + size['width']),
                        int(loc['y'] + size['height'])
                    ))
                    buf = BytesIO()
                    cropped.save(buf, format='PNG')
                    bg_image_dict[labeled] = base64.b64encode(buf.getvalue()).decode()
                except Exception:
                    text_elements.append(labeled)
            else:
                text_elements.append(labeled)
        except StaleElementReferenceException:
            continue
        except Exception:
            continue

    return text_elements, bg_image_dict


def extract_form_elements(driver) -> list:
    """SC 3.3.2 — Labels or Instructions. Returns list of root form container HTML."""
    selectors = [
        'form', "div[role='form']", "div[role='radiogroup']",
        "div[role='group']", 'fieldset',
    ]
    all_html = []
    for sel in selectors:
        for container in driver.find_elements(By.CSS_SELECTOR, sel):
            try:
                all_html.append(container.get_attribute('outerHTML') or '')
            except Exception:
                continue
    # Deduplicate nested: remove HTML that is contained in a larger one
    root = []
    for h in all_html:
        if h and not any(h != o and h in o for o in all_html):
            root.append(h)
    return root


def extract_form_and_headings(driver) -> dict:
    """SC 2.4.6 — Headings and Labels."""
    form_data = extract_form_elements(driver)

    heading_selectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', "[role='heading']"]
    headings = []
    for sel in heading_selectors:
        for h in driver.find_elements(By.CSS_SELECTOR, sel):
            try:
                h_html, h_xpath = extract_outer_html_and_xpath(driver, h)
                siblings = []
                sib = h
                for _ in range(2):
                    try:
                        sib = sib.find_element(By.XPATH, 'following-sibling::*[1]')
                        siblings.append(sib.get_attribute('outerHTML') or '')
                    except NoSuchElementException:
                        break
                formatted = format_with_xpath(h_html, h_xpath)
                if siblings:
                    formatted += ' ' + ' '.join(siblings)
                headings.append(formatted)
            except Exception:
                continue

    return {'forms': form_data, 'headings': headings}


def extract_section_headings(driver) -> list:
    """SC 2.4.10 — Section Headings. Returns list of per-section dicts."""
    results = []
    for section in driver.find_elements(By.TAG_NAME, 'section'):
        section_html = (section.get_attribute('outerHTML') or '').split('>')[0] + '>'
        item = {'html': section_html, 'no_heading': True}
        headings_in_section = []
        for sel in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', "[role='heading']"]:
            for h in section.find_elements(By.CSS_SELECTOR, sel):
                try:
                    h_html, h_xpath = extract_outer_html_and_xpath(driver, h)
                    sib_html = []
                    sib = h
                    for _ in range(2):
                        try:
                            sib = sib.find_element(By.XPATH, 'following-sibling::*[1]')
                            sib_html.append(sib.get_attribute('outerHTML') or '')
                        except Exception:
                            break
                    headings_in_section.append(
                        format_with_xpath(h_html, h_xpath) + ' ' + ' '.join(sib_html))
                except Exception:
                    continue
        if headings_in_section:
            item['no_heading'] = False
            item['headings'] = ' '.join(headings_in_section)
        results.append(item)
    return results


def extract_info_relation(driver) -> dict:
    """SC 1.3.1 — Info and Relationships. Returns structured element dict."""

    def _collect(by_method, selector):
        results = []
        for el in driver.find_elements(by_method, selector):
            try:
                h, xpath = extract_outer_html_and_xpath(driver, el)
                if h:
                    results.append(format_with_xpath(h, xpath))
            except Exception:
                continue
        return results

    def _with_parent(tag):
        results = []
        for el in driver.find_elements(By.TAG_NAME, tag):
            try:
                parent = el.find_element(By.XPATH, 'parent::*')
                p_html = parent.get_attribute('outerHTML') or ''
                h, xpath = extract_outer_html_and_xpath(driver, el)
                results.append(format_with_xpath(p_html + h, xpath))
            except Exception:
                continue
        return results

    tables = _collect(By.TAG_NAME, 'table')
    pre_elems = _collect(By.TAG_NAME, 'pre')
    aria_roles = _collect(By.XPATH, '//*[@role]')
    fieldsets = _collect(By.TAG_NAME, 'fieldset')
    headings = _collect(By.CSS_SELECTOR, 'h1,h2,h3,h4,h5,h6')
    links = _collect(By.TAG_NAME, 'a')
    lists = _collect(By.CSS_SELECTOR, 'ul,ol,li')
    radio_checkbox = _collect(By.XPATH,
        "//input[@type='radio'] | //input[@type='checkbox']")
    paragraphs = _collect(By.TAG_NAME, 'p')

    # CSS-inserted content
    css_content = driver.execute_script("""
        var result = [];
        document.querySelectorAll('*').forEach(function(el) {
            var before = window.getComputedStyle(el,'::before').content;
            var after  = window.getComputedStyle(el,'::after').content;
            if (before !== 'none' || after !== 'none') {
                result.push({before: before, after: after, html: el.outerHTML});
            }
        });
        return result;
    """) or []

    return {
        'tables': tables,
        'pre_elements': pre_elems,
        'aria_role_elements': aria_roles,
        'fieldset_elements': fieldsets,
        'headings': headings,
        'links': links,
        'lists': lists,
        'radio_checkbox_elements': radio_checkbox,
        'paragraph_elements': paragraphs,
        'css_insertion_elements': [
            {'before': c['before'], 'after': c['after'], 'html': c['html']}
            for c in css_content
        ],
    }


def extract_meaningful_sequence(driver) -> tuple:
    """SC 1.3.2 — Meaningful Sequence. Returns (table_list, whitespace_list, layout_list)."""

    def _linearize(table_html):
        soup = BeautifulSoup(table_html, 'html.parser')
        rows = []
        for tr in soup.find_all('tr'):
            cells = tr.find_all(['th', 'td'])
            rows.append(' '.join(c.get_text(strip=True) for c in cells))
        return '\n'.join(rows)

    tables = []
    for tbl in driver.find_elements(By.TAG_NAME, 'table'):
        try:
            h, xpath = extract_outer_html_and_xpath(driver, tbl)
            tables.append({
                'original': format_with_xpath(h, xpath),
                'linearized': _linearize(h),
            })
        except Exception:
            continue

    def _has_whitespace_columns(text):
        lines = text.splitlines()
        return len(lines) >= 2 and all(len(re.split(r'\s{2,}', ln)) >= 2 for ln in lines)

    whitespace_list = []
    for el in driver.find_elements(By.XPATH, '//pre | //div | //p | //span'):
        try:
            txt = el.text.strip()
            if txt and _has_whitespace_columns(txt) and txt not in whitespace_list:
                whitespace_list.append(txt)
        except StaleElementReferenceException:
            continue

    layout_elements = []
    for sel in ['[style*="float"]', '[style*="flex"]', '[style*="grid"]']:
        for el in driver.find_elements(By.CSS_SELECTOR, sel):
            try:
                h, xpath = extract_outer_html_and_xpath(driver, el)
                if h:
                    layout_elements.append(format_with_xpath(h, xpath))
            except Exception:
                continue

    return tables, whitespace_list, layout_elements


def extract_name_role_elements(driver) -> dict:
    """SC 4.1.2 — Name, Role, Value."""
    xpaths_map = {
        'button': ("//button | //input[@type='button' or @type='submit' or @type='reset'] "
                   "| //*[@role='button']"),
        'aria_hidden': "//*[@aria-hidden]",
        'menuitem': "//*[@role='menuitem']",
        'iframe': '//iframe',
        'link': "//a | //*[@role='link']",
        'script_controlled': (
            "//div[@onclick or @onkeydown or @onkeypress or @onkeyup] | "
            "//span[@onclick or @onkeydown or @onkeypress or @onkeyup]"
        ),
    }
    result = {k: [] for k in xpaths_map}
    for key, xp in xpaths_map.items():
        for el in driver.find_elements(By.XPATH, xp):
            try:
                h, xpath = extract_outer_html_and_xpath(driver, el)
                if h:
                    result[key].append(format_with_xpath(h, xpath))
            except Exception:
                continue
    return result


def extract_reflow(driver) -> dict:
    """SC 1.4.10 — Reflow. Returns {original: b64, reflow: b64}."""
    orig_size = driver.get_window_size()
    driver.set_window_size(1280, 1024)
    original_b64 = take_full_page_screenshot(driver, 'reflow_original')
    _set_zoom(driver, 400)
    time.sleep(0.8)
    reflow_b64 = take_full_page_screenshot(driver, 'reflow_400pct')
    # restore
    driver.set_window_size(orig_size['width'], orig_size['height'])
    _set_zoom(driver, 100)
    return {'original': original_b64, 'reflow': reflow_b64}


def extract_color_screenshots(driver) -> dict:
    """SC 1.4.1 — Use of Color. Returns full-page screenshot for visual analysis."""
    return {'screenshot': take_full_page_screenshot(driver, 'color_screenshot')}


def extract_error_screenshot(driver) -> str:
    """SC 3.3.1 / 3.3.3 — Error Identification / Error Suggestion. Returns base64 screenshot."""
    return take_full_page_screenshot(driver, 'error_screenshot')


# ---------------------------------------------------------------------------
# Master extraction dispatcher
# ---------------------------------------------------------------------------

def extract_for_sc(driver, sc: str) -> object:
    """
    Return extraction data for a single SC.
    Called by the runner once per (page, SC) pair.
    Returns None if SC is not covered.
    """
    sc = sc.strip()
    if sc == '1.1.1':
        return extract_visual_elements(driver)
    if sc == '1.3.1':
        return extract_info_relation(driver)
    if sc == '1.3.2':
        return extract_meaningful_sequence(driver)
    if sc == '1.4.1':
        return extract_color_screenshots(driver)
    if sc == '1.4.3':
        return extract_contrast_elements(driver)
    if sc == '1.4.5':
        return extract_img_urls(driver)
    if sc == '1.4.10':
        return extract_reflow(driver)
    if sc == '2.4.2':
        return extract_page_title(driver)
    if sc == '2.4.4':
        return extract_links(driver)
    if sc == '2.4.6':
        return extract_form_and_headings(driver)
    if sc == '2.4.10':
        return extract_section_headings(driver)
    if sc in ('3.3.1', '3.3.3'):
        return extract_error_screenshot(driver)
    if sc == '3.3.2':
        return extract_form_elements(driver)
    if sc == '4.1.2':
        return extract_name_role_elements(driver)
    return None
