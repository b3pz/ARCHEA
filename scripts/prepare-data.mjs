import {existsSync,copyFileSync} from 'node:fs';
if(!existsSync('app/data/seed.json'))copyFileSync('app/data/seed.example.json','app/data/seed.json');
