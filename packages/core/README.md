# @node-ntlm/core

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
