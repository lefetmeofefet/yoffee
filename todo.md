* setting props inside expressions!!!! shit?
* when prop A is used in child expression, and only after that
it's used inside parent expression, make sure child doesnt re-evaluate
* test multiple yoffees
* when returning null in render function, it dies (shouldnt)
* don't make it a class? look at hybrids: https://hybrids.js.org/#/getting-started/concepts?id=translation
* data-attributes (forgot what they do...)
* event handlers are never deleted. they should be if the handler attribute changes / is deleted
* spaces in composite textnode are forgotten (<div>1 ${"2"} 3</div> will show as "1 23")
* eventListeners: we automatically turn attributes that start with "on" to eventListeners.... but how can we send callbacks that start with on? we want dat!!! REEEE
    -  solution! add both eventListener and function callback property. why not.
* update readme to have more documentation on createYoffeeElement and YoffeeElement class