# @node-ntlm/axios

<p align="center">
  <a href="https://nodejs.org/">
    <img alt="NodeJs Support" src="https://img.shields.io/node/v/@node-ntlm/axios?style=flat-square&logo=Node.js">
  </a>
  <a href="https://www.npmjs.com/package/@node-ntlm/axios">
    <img alt="weekly downloads from npm" src="https://img.shields.io/npm/dw/@node-ntlm/axios.svg?style=flat-square">
  </a>
  <a href="https://renovatebot.com/">
    <img alt="Renovate Bot" src="https://img.shields.io/badge/renovate-enabled-brightgreen.svg?style=flat-square">
  </a>
  <a href="https://snyk.io/advisor/npm-package/@node-ntlm/axios">
    <img alt="SNYK Report" src="https://img.shields.io/snyk/vulnerabilities/npm/@node-ntlm/axios?style=flat-square">
  </a>
  <a href="https://www.npmjs.org/package/@node-ntlm/axios">
    <img alt="npm version" src="http://img.shields.io/npm/v/@node-ntlm/axios.svg?style=flat-square&logo=npm">
  </a>
  <br/>
  <a href="https://bundlephobia.com/result?p=@node-ntlm/axios">
    <img alt="Minified size" src="https://img.shields.io/bundlephobia/min/@node-ntlm/axios?style=flat-square">
  </a>
  <a href="https://bundlephobia.com/result?p=@node-ntlm/axiose">
    <img alt="Minified-Zipped size" src="https://img.shields.io/bundlephobia/minzip/@node-ntlm/axios?style=flat-square">
  </a>
  <a href="https://github.com/semantic-release/semantic-release">
    <img alt="Semantic Release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-blue.svg?style=flat-square">
  </a>
  <a href="https://github.com/prettier/prettier">
    <img alt="code style: prettier" src="https://img.shields.io/badge/code%20style-prettier-blue?style=flat-square&logo=Prettier">
  </a>
  <a href="https://github.com/skrtheboss/node-ntlm/blob/master/LICENSE">
    <img alt="Mit License" src="https://img.shields.io/npm/l/@node-ntlm/axios?color=blue&style=flat-square">
  </a>
</p>

**@node-ntlm/axios** is a Node.js library to do HTTP NTLM authentication over axios

It's heavily inspired from [axios-ntlm](https://github.com/Catbuttes/axios-ntlm) written in typescript, promise based and with nodejs 18 support.

## Install

You can install **@node-ntlm/axios** using the Node Package Manager (npm):

    npm install @node-ntlm/axios

## How to use

This example will create you a brand new axios instance you can utilise the same as any other axios instance

```typescript
import { NtlmClient, NtlmCredentials } from '@node-ntlm/axios';

(async () => {
    const credentials: NtlmCredentials = {
        username: 'username',
        password: 'password',
        domain: 'domain',
    };

    const client = NtlmClient(credentials);

    try {
        const resp = await client({
            url: 'https://protected.site.example.com',
            method: 'get',
        });
        console.log(resp.data);
    } catch (err) {
        console.log(err);
        console.log('Failed');
    }
})();
```

### With a custom Axios config

This shows how to pass in an axios config in the same way that you would when setting up any other axios instance.

Note: If doing this, be aware that http(s)Agents need to be attached to keep the connection alive. If there are none attached already, they will be added. If you are providing your own then you will need to set this up.

```typescript
import { AxiosRequestConfig } from 'axios';
import { NtlmClient, NtlmCredentials } from '@node-ntlm/axios';

(async () => {
    const credentials: NtlmCredentials = {
        username: 'username',
        password: 'password',
        domain: 'domain',
    };

    const config: AxiosRequestConfig = {
        baseURL: 'https://protected.site.example.com',
        method: 'get',
    };

    const client = NtlmClient(credentials, config);

    try {
        const resp = await client.get('/api/123');
        console.log(resp);
    } catch (err) {
        console.log(err);
        console.log('Failed');
    }
})();
```
