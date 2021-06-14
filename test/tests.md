## Tricky points to Remember

* Templates inside templates can use parameters from the outer template:
```javascript
htmel(state)`
<div>
    ${() => {
        let a = state.a;
        return htmel()`${a}`
    }}
</div>
`
```
The inner template shouldn't be cached, because if it is, it won't be updated.

* Single state object shared between multiple htmels