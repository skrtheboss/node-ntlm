# @node-ntlm/core

<p align="center">
  <a href="https://nodejs.org/">
    <img alt="NodeJs Support" src="https://img.shields.io/node/v/@node-ntlm/core?style=flat-square&logo=Node.js">
  </a>
  <a href="https://www.npmjs.com/package/@node-ntlm/core">
    <img alt="weekly downloads from npm" src="https://img.shields.io/npm/dw/@node-ntlm/core.svg?style=flat-square">
  </a>
  <a href="https://renovatebot.com/">
    <img alt="Renovate Bot" src="https://img.shields.io/badge/renovate-enabled-brightgreen.svg?style=flat-square">
  </a>
  <a href="https://snyk.io/advisor/npm-package/@node-ntlm/core">
    <img alt="SNYK Report" src="https://img.shields.io/snyk/vulnerabilities/npm/@node-ntlm/core?style=flat-square">
  </a>
  <a href="https://www.npmjs.org/package/@node-ntlm/core">
    <img alt="npm version" src="http://img.shields.io/npm/v/@node-ntlm/core.svg?style=flat-square&logo=npm">
  </a>
  <br/>
  <a href="https://bundlephobia.com/result?p=@node-ntlm/core">
    <img alt="Minified size" src="https://img.shields.io/bundlephobia/min/@node-ntlm/core?style=flat-square">
  </a>
  <a href="https://bundlephobia.com/result?p=@node-ntlm/coree">
    <img alt="Minified-Zipped size" src="https://img.shields.io/bundlephobia/minzip/@node-ntlm/core?style=flat-square">
  </a>
  <a href="https://github.com/semantic-release/semantic-release">
    <img alt="Semantic Release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-blue.svg?style=flat-square">
  </a>
  <a href="https://github.com/prettier/prettier">
    <img alt="code style: prettier" src="https://img.shields.io/badge/code%20style-prettier-blue?style=flat-square&logo=Prettier">
  </a>
  <a href="https://github.com/skrtheboss/node-ntlm/blob/master/LICENSE">
    <img alt="Mit License" src="https://img.shields.io/npm/l/@node-ntlm/core?color=blue&style=flat-square">
  </a>
</p>

**@node-ntlm/core** is a Node.js NTLM utility package

It's heavily inspired from [httpntlm](https://github.com/SamDecrock/node-http-ntlm) written in typescript and with nodejs 18 support.

## Install

You can install **@node-ntlm/core** using the Node Package Manager (npm):

    npm install @node-ntlm/core

## How to use

```typescript
import { createType1Message, createType3Message, parseType2Message } from '@node-ntlm/core';
import { fetch } from 'undici';

const negotiateMessage = createType1Message({ domain: 'test.host', workstation: 'pc1' });

const negotiateResponse = await fetch('http://test-service.url/api', {
    headers: { authorization: negotiateMessage },
    keepalive: true,
});

const type2Message = negotiateResponse.headers.get('www-authenticate');

if (!type2Message) {
    throw new Error('Could not find type 2 message on response headers!');
}

const authMessage = createType3Message(parseType2Message(type2Message), {
    domain: 'test.host',
    workstation: 'pc1',
    username: 'test',
    password: 'test',
});

const result = await fetch('http://test-service.url/api', {
    headers: { Authorization: authMessage },
    keepalive: false,
});

console.log(await result.json());
```

# @node-ntlm/core/testing

## Usage:

```typescript
import { generateNegotiateResponse } from '@node-ntlm/core/testing';

const negotiateRespnse = generateNegotiateResponse(...getAuthorization header somewhere)
```
