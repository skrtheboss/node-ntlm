# @node-ntlm/httpreq

<p align="center">
  <a href="https://nodejs.org/">
    <img alt="NodeJs Support" src="https://img.shields.io/node/v/@node-ntlm/httpreq?style=flat-square&logo=Node.js">
  </a>
  <a href="https://www.npmjs.com/package/@node-ntlm/httpreq">
    <img alt="weekly downloads from npm" src="https://img.shields.io/npm/dw/@node-ntlm/httpreq.svg?style=flat-square">
  </a>
  <a href="https://renovatebot.com/">
    <img alt="Renovate Bot" src="https://img.shields.io/badge/renovate-enabled-brightgreen.svg?style=flat-square">
  </a>
  <a href="https://snyk.io/advisor/npm-package/@node-ntlm/httpreq">
    <img alt="SNYK Report" src="https://img.shields.io/snyk/vulnerabilities/npm/@node-ntlm/httpreq?style=flat-square">
  </a>
  <a href="https://www.npmjs.org/package/@node-ntlm/httpreq">
    <img alt="npm version" src="http://img.shields.io/npm/v/@node-ntlm/httpreq.svg?style=flat-square&logo=npm">
  </a>
  <br/>
  <a href="https://bundlephobia.com/result?p=@node-ntlm/httpreq">
    <img alt="Minified size" src="https://img.shields.io/bundlephobia/min/@node-ntlm/httpreq?style=flat-square">
  </a>
  <a href="https://bundlephobia.com/result?p=@node-ntlm/httpreqe">
    <img alt="Minified-Zipped size" src="https://img.shields.io/bundlephobia/minzip/@node-ntlm/httpreq?style=flat-square">
  </a>
  <a href="https://github.com/semantic-release/semantic-release">
    <img alt="Semantic Release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-blue.svg?style=flat-square">
  </a>
  <a href="https://github.com/prettier/prettier">
    <img alt="code style: prettier" src="https://img.shields.io/badge/code%20style-prettier-blue?style=flat-square&logo=Prettier">
  </a>
  <a href="https://github.com/skrtheboss/node-ntlm/blob/master/LICENSE">
    <img alt="Mit License" src="https://img.shields.io/npm/l/@node-ntlm/httpreq?color=blue&style=flat-square">
  </a>
</p>

**@node-ntlm/httpreq** is a Node.js library to do HTTP NTLM authentication

It's heavily inspired from [httpntlm](https://github.com/SamDecrock/node-http-ntlm) written in typescript, promise based and with nodejs 18 support.

## Install

You can install **@node-ntlm/httpreq** using the Node Package Manager (npm):

    npm install @node-ntlm/httpreq

## How to use

```typescript
import { get } from ''@node-ntlm/httpreq';

const res = await get({
    url: 'https://someurl.com',
    username: 'm$',
    password: 'stinks',
    workstation: 'choose.something',
    domain: '',
});

console.log(res.headers);
console.log(res.body);
```

It supports **http** and **https**.

## pre-encrypt the password

```typescript
import { get } from '@node-ntlm/httpreq';
import { createLMHashedPasswordV1, createNTHashedPasswordV1 } from '@node-ntlm/httpreq';

let lm = createLMHashedPasswordV1('Azx123456');
let nt = createNTHashedPasswordV1('Azx123456');

console.log(lm);
console.log(Array.prototype.slice.call(lm, 0));

lm = new Buffer([183, 180, 19, 95, 163, 5, 118, 130, 30, 146, 159, 252, 1, 57, 81, 39]);

console.log(lm);

console.log(nt);
console.log(Array.prototype.slice.call(nt, 0));

nt = new Buffer([150, 27, 7, 219, 220, 207, 134, 159, 42, 60, 153, 28, 131, 148, 14, 1]);

console.log(nt);

const res = await get({
    url: 'https://someurl.com',
    username: 'm$',
    lm_password: lm,
    nt_password: nt,
    workstation: 'choose.something',
    domain: '',
});

console.log(res.headers);
console.log(res.body);

/* you can save the array into your code and use it when you need it

<Buffer b7 b4 13 5f a3 05 76 82 1e 92 9f fc 01 39 51 27>// before convert to array
[ 183, 180, 19, 95, 163, 5, 118, 130, 30, 146, 159, 252, 1, 57, 81, 39 ]// convert to array
<Buffer b7 b4 13 5f a3 05 76 82 1e 92 9f fc 01 39 51 27>//convert back to buffer

<Buffer 96 1b 07 db dc cf 86 9f 2a 3c 99 1c 83 94 0e 01>
[ 150, 27, 7, 219, 220, 207, 134, 159, 42, 60, 153, 28, 131, 148, 14, 1 ]
<Buffer 96 1b 07 db dc cf 86 9f 2a 3c 99 1c 83 94 0e 01>
*/
```

## Options

-   `url:` _{String}_ URL to connect. (Required)
-   `username:` _{String}_ Username. (Required)
-   `password:` _{String}_ Password. (Required)
-   `workstation:` _{String}_ Name of workstation or `''`.
-   `domain:` _{String}_ Name of domain or `''`.

if you already got the encrypted password,you should use this two param to replace the 'password' param.

-   `lm_password` _{Buffer}_ encrypted lm password.(Required)
-   `nt_password` _{Buffer}_ encrypted nt password. (Required)

You can also pass along all other options of [httpreq](https://github.com/SamDecrock/node-httpreq), including custom headers, cookies, body data, ... and use POST, PUT or DELETE instead of GET.

## NTLMv2

When NTLMv2 extended security and target information can be negotiated with the server, this library assumes
the server supports NTLMv2 and creates responses according to the NTLMv2 specification (the actually supported
NTLM version cannot be negotiated).
Otherwise, NTLMv1 or NTLMv1 with NTLMv2 extended security will be used.

## Download binary files

```typescript
import { writeFile } from 'node:fs/promises';

import { get } from '@node-ntlm/httpreq';

try {
    const response = await get({
        url: 'https://someurl.com/file.xls',
        username: 'm$',
        password: 'stinks',
        workstation: 'choose.something',
        domain: '',
        binary: true,
    });

    await writeFile('file.xls', response.body, { encoding: 'utf8' });

    console.log('file.xls saved!');
} catch (error) {
    console.log('An error occurred', error);
}
```
