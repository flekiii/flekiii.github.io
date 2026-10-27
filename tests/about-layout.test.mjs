import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync(new URL("../index.html",import.meta.url),"utf8");

test("About speaks about freedom, not the old biography",()=>{
 assert.match(source,/Freedom, made real\./);
 assert.match(source,/Свобода, втілена в реальність/);
 assert.match(source,/Your space\. Your choices\. Your world\./);
 assert.doesNotMatch(source,/Hey, I'm Fleki\. <span>Nice to meet you/);
 assert.doesNotMatch(source,/Web & software<\/span>/);
 assert.doesNotMatch(source,/Explore my GitHub ↗/);
});

test("About fits one viewport on desktop and mobile without scrolling",()=>{
 assert.match(source,/body\.about-view\{height:100dvh;overflow:hidden/);
 assert.match(source,/#page-about\.active\{height:calc\(100dvh - 89px - 98px\)/);
 assert.match(source,/@media\(max-width:700px\)/);
 assert.match(source,/#page-about\.active\{height:calc\(100dvh - 75px - 75px\)/);
 assert.match(source,/document\.body\.classList\.toggle\('about-view',id==='about'\)/);
 assert.match(source,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});

test("About retains working community, support, and policy links",()=>{
 for(const link of [
  "https://discord.gg/aMmRhCHd4j",
  "https://t.me/flekiswrld",
  "https://send.monobank.ua/jar/91HH8iY31q",
  "/privacy.html","/rules.html","/account-export.html"
 ])assert.ok(source.includes(link),link);
});
