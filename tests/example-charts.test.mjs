import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const require=createRequire(import.meta.url);
function witness(failSecond=false) {
  const source=process.env.CHART_SOURCE_PARENT==='1'
    ? execFileSync('git',['show','HEAD:app/example/ExampleCharts.tsx'],{encoding:'utf8'})
    : readFileSync(new URL('../app/example/ExampleCharts.tsx',import.meta.url),'utf8');
  const effects=[],charts=[]; let refs=0;
  const library={ColorType:{Solid:'solid'},LineSeries:'line',AreaSeries:'area',createChart(node,options){
    if (failSecond && charts.length===1) throw new Error('fixture: second chart unavailable');
    const chart={node,options,series:[],removed:0,fit:0,
      addSeries(kind,style){const series={kind,style,setData(data){this.data=data}};this.series.push(series);return series},
      timeScale(){return {fitContent:()=>{chart.fit++}}},remove(){this.removed++}};
    charts.push(chart);return chart;
  }};
  const fakeRequire=name=>name==='react' ? {useRef:()=>({current:{node:refs++}}),useEffect:fn=>effects.push(fn)}
    : name==='lightweight-charts' ? library : require(name);
  const mod={exports:{}};
  const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,
    jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}});
  new Function('require','module','exports',outputText)(fakeRequire,mod,mod.exports);
  const points=[{time:'2024-01-01',equity_pct:0,bench_pct:0,net:0},
    {time:'2024-01-02',equity_pct:20,bench_pct:null,net:20},
    {time:'2024-01-03',equity_pct:10,bench_pct:5,net:10}];
  mod.exports.ExampleCharts({points});
  return {charts,cleanup:effects[0](),points};
}

test('v5 options and plotted equity stay explicit',()=>{
  const {charts,cleanup,points}=witness();
  assert.equal(charts.length,2);
  assert.deepEqual(charts[0].options.layout.background,{type:'solid',color:'transparent'});
  assert.equal(charts[0].options.timeScale.visible,true);
  assert.equal(charts[1].series[0].style.lineColor,'#EF4444');
  assert.equal(charts[0].series[0].data.length,points.length);
  assert.equal(charts[0].series[1].data.length,2);
  assert.deepEqual(charts.map(c=>c.fit),[1,1]);
  cleanup();
});

test('unmount removes both charts using supported API',()=>{
  const {charts,cleanup}=witness();cleanup();
  assert.deepEqual(charts.map(c=>c.removed),[1,1]);
});

test('partially created chart is still removed after initialization fails',()=>{
  const {charts,cleanup}=witness(true);
  assert.equal(charts.length,1);cleanup();assert.equal(charts[0].removed,1);
});

test('separate DOM and Worker projects still cover every source file',()=>{
  const root=fileURLToPath(new URL('../',import.meta.url));
  const main=ts.readConfigFile(fileURLToPath(new URL('../tsconfig.json',import.meta.url)),ts.sys.readFile);
  assert.equal(main.error,undefined);
  const all=ts.parseJsonConfigFileContent({...main.config,exclude:['node_modules']},ts.sys,root);
  const dom=ts.parseJsonConfigFileContent(main.config,ts.sys,root);
  const workerPath=fileURLToPath(new URL('../tsconfig.worker.json',import.meta.url));
  const workerConfig=ts.readConfigFile(workerPath,ts.sys.readFile);
  const worker=ts.parseJsonConfigFileContent(workerConfig.config,ts.sys,root);
  const covered=new Set([...dom.fileNames,...worker.fileNames]);
  assert.deepEqual(all.fileNames.filter(name=>!covered.has(name)),[]);
  assert.ok(worker.fileNames.some(name=>name.endsWith('/worker/index.ts')));
  assert.ok(worker.fileNames.some(name=>name.endsWith('/db/index.ts')));
  assert.ok(worker.fileNames.some(name=>name.endsWith('/examples/d1/app/api/notes/route.ts')));
  assert.equal(dom.fileNames.some(name=>name.endsWith('/types/cloudflare-runtime.d.ts')),false);
});
