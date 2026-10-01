import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../kaamset-finale/package.json',import.meta.url));
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const dir=new URL('../public/crew/',import.meta.url);const name=process.argv[2];if(!/^(riya|tara|milo|milan|vijay|baba|ma|chotu)$/.test(name))throw Error('Unknown sprite');
const img=await loadImage(fs.readFileSync(new URL(name+'.svg',dir)));const canvas=createCanvas(124,124);canvas.getContext('2d').drawImage(img,0,0,124,124);fs.writeFileSync(new URL(name+'.png',dir),canvas.toBuffer('image/png'));
