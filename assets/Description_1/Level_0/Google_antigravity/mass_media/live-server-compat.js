function createIcon(paths) {
  return function Icon(props) {
    const size = props && props.size ? props.size : 24;
    const className = props && props.className ? props.className : "";
    const strokeWidth = props && props.strokeWidth ? props.strokeWidth : 2;

    return React.createElement(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: strokeWidth,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: className,
        "aria-hidden": "true",
      },
      paths.map(function (path, index) {
        return React.createElement(path.tag, Object.assign({ key: index }, path.attrs));
      })
    );
  };
}

window.IconCompat = {
  Menu: createIcon([
    { tag: "line", attrs: { x1: "3", y1: "6", x2: "21", y2: "6" } },
    { tag: "line", attrs: { x1: "3", y1: "12", x2: "21", y2: "12" } },
    { tag: "line", attrs: { x1: "3", y1: "18", x2: "21", y2: "18" } },
  ]),
  Search: createIcon([
    { tag: "circle", attrs: { cx: "11", cy: "11", r: "7" } },
    { tag: "line", attrs: { x1: "20", y1: "20", x2: "16.65", y2: "16.65" } },
  ]),
  User: createIcon([
    { tag: "path", attrs: { d: "M20 21a8 8 0 0 0-16 0" } },
    { tag: "circle", attrs: { cx: "12", cy: "8", r: "4" } },
  ]),
  ChevronDown: createIcon([{ tag: "polyline", attrs: { points: "6 9 12 15 18 9" } }]),
  ChevronUp: createIcon([{ tag: "polyline", attrs: { points: "18 15 12 9 6 15" } }]),
  ChevronRight: createIcon([{ tag: "polyline", attrs: { points: "9 18 15 12 9 6" } }]),
  Clock: createIcon([
    { tag: "circle", attrs: { cx: "12", cy: "12", r: "9" } },
    { tag: "polyline", attrs: { points: "12 7 12 12 15 15" } },
  ]),
  Share2: createIcon([
    { tag: "circle", attrs: { cx: "18", cy: "5", r: "3" } },
    { tag: "circle", attrs: { cx: "6", cy: "12", r: "3" } },
    { tag: "circle", attrs: { cx: "18", cy: "19", r: "3" } },
    { tag: "line", attrs: { x1: "8.6", y1: "13.5", x2: "15.4", y2: "17.5" } },
    { tag: "line", attrs: { x1: "15.4", y1: "6.5", x2: "8.6", y2: "10.5" } },
  ]),
  Bookmark: createIcon([{ tag: "path", attrs: { d: "M6 4h12v16l-6-4-6 4V4z" } }]),
  MessageSquare: createIcon([
    { tag: "path", attrs: { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" } },
  ]),
  Heart: createIcon([{ tag: "path", attrs: { d: "M12 21s-7-4.35-9-8.6C1.4 8.8 3.5 5 7.5 5c2.1 0 3.4 1.2 4.5 2.7C13.1 6.2 14.4 5 16.5 5c4 0 6.1 3.8 4.5 7.4C19 16.65 12 21 12 21z" } }]),
  MoreHorizontal: createIcon([
    { tag: "circle", attrs: { cx: "5", cy: "12", r: "1.5", fill: "currentColor", stroke: "none" } },
    { tag: "circle", attrs: { cx: "12", cy: "12", r: "1.5", fill: "currentColor", stroke: "none" } },
    { tag: "circle", attrs: { cx: "19", cy: "12", r: "1.5", fill: "currentColor", stroke: "none" } },
  ]),
  PenTool: createIcon([
    { tag: "path", attrs: { d: "M12 19l7-7 3 3-7 7-3 1z" } },
    { tag: "path", attrs: { d: "M18 13L11 6l2.5-2.5a2.12 2.12 0 0 1 3 0L20.5 7a2.12 2.12 0 0 1 0 3z" } },
    { tag: "line", attrs: { x1: "2", y1: "22", x2: "9", y2: "15" } },
  ]),
  MessageCircle: createIcon([
    { tag: "path", attrs: { d: "M21 11.5a8.5 8.5 0 0 1-8.5 8.5H7l-4 3v-6A8.5 8.5 0 1 1 21 11.5z" } },
  ]),
  Check: createIcon([{ tag: "polyline", attrs: { points: "20 6 9 17 4 12" } }]),
  X: createIcon([
    { tag: "line", attrs: { x1: "18", y1: "6", x2: "6", y2: "18" } },
    { tag: "line", attrs: { x1: "6", y1: "6", x2: "18", y2: "18" } },
  ]),
  Star: createIcon([{ tag: "polygon", attrs: { points: "12 2 15.1 8.5 22 9.3 17 14.2 18.2 21 12 17.6 5.8 21 7 14.2 2 9.3 8.9 8.5 12 2" } }]),
  Facebook: createIcon([
    { tag: "circle", attrs: { cx: "12", cy: "12", r: "9" } },
    { tag: "path", attrs: { d: "M13 8h2V5h-2a3 3 0 0 0-3 3v2H8v3h2v6h3v-6h2.2l.8-3H13V8a1 1 0 0 1 1-1z" } },
  ]),
  Twitter: createIcon([
    { tag: "path", attrs: { d: "M22 5.8c-.7.3-1.5.5-2.3.6a4 4 0 0 0 1.7-2.2 8 8 0 0 1-2.5 1A4 4 0 0 0 12 8.3a11.3 11.3 0 0 1-8.2-4.1 4 4 0 0 0 1.2 5.3 3.9 3.9 0 0 1-1.8-.5v.1a4 4 0 0 0 3.2 3.9 4 4 0 0 1-1.8.1 4 4 0 0 0 3.7 2.8A8 8 0 0 1 3 17.5a11.3 11.3 0 0 0 6.1 1.8c7.3 0 11.4-6.3 11.1-11.9.8-.6 1.4-1.3 1.8-2.1z" } },
  ]),
  Instagram: createIcon([
    { tag: "rect", attrs: { x: "4", y: "4", width: "16", height: "16", rx: "4" } },
    { tag: "circle", attrs: { cx: "12", cy: "12", r: "3.5" } },
    { tag: "circle", attrs: { cx: "17", cy: "7", r: "1" } },
  ]),
};
