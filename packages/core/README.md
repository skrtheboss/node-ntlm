# @node-ntlm/core

## Usage:

```typescript
import { createType1Message, createType3Message, parseType2Message } from '@node-ntlm/core';

const negotiateMessage = createType1Message({ domain: 'test.host', workstation: 'pc1' });

const negotiateResponse = await fetch('http://ntlm-endpoint', { headers: { Authorization: negotiateMessage } });

const authMessage = createType3Message(parseType2Message(negotiateResponse.headers.get('www-authenticate')), {
    domain: 'test.host',
    workstation: 'pc1',
    username: 'test',
    password: 'test',
});

const result = await fetch('http://ntlm-endpoint', { headers: { Authorization: authMessage } });

console.log(result);
```

# @node-ntlm/core/testing

## Usage:

```typescript
import { generateNegotiateResponse } from '@node-ntlm/core/testing';

const negotiateRespnse = generateNegotiateResponse(...getAuthorization header somewhere)
```
