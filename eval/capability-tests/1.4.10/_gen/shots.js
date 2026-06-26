const path=require('path'),fs=require('fs');
const puppeteer=require('puppeteer');
const ROOT=path.resolve(__dirname,'..');
const OUT=path.join(__dirname,'shots'); fs.mkdirSync(OUT,{recursive:true});
const TARGETS=[
  ['non-excepted-horizontal-overflow-at-320px','case-01.html','pos-fixedwidth'],
  ['non-excepted-horizontal-overflow-at-320px','case-13.html','neg-maxwidth'],
  ['f102-content-disappears-no-equivalent','case-01.html','pos-displaynone-aside'],
  ['f102-content-disappears-no-equivalent','case-08.html','pos-overflowhidden-clip'],
  ['f102-content-disappears-no-equivalent','case-12.html','neg-hamburger'],
  ['long-unbreakable-string-overflow-c33','case-01.html','pos-longurl'],
  ['long-unbreakable-string-overflow-c33','case-12.html','neg-overflowwrap'],
  ['sticky-fixed-content-consumes-small-viewport','case-01.html','pos-200px-header'],
  ['sticky-fixed-content-consumes-small-viewport','case-12.html','neg-thinbar'],
];
(async()=>{
  const b=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
  for(const [d,f,tag] of TARGETS){
    for(const [w,h,wn] of [[320,256,'320'],[1280,800,'1280']]){
      const p=await b.newPage(); await p.setViewport({width:w,height:h,deviceScaleFactor:1});
      await p.goto('file://'+path.join(ROOT,d,f),{waitUntil:'networkidle0'});
      await p.screenshot({path:path.join(OUT,`${tag}_${wn}.png`)});
      await p.close();
    }
  }
  await b.close();
  console.log('shots written to',OUT);
})();
