# xstate-first-react

## Experimenting with putting XState in charge of React rather than vice versa.

I'm experimenting with an xstate-first approach here. The app starts with a state machine that in it's context holds the rendered view. Components are rendered using invoked callbacks _(see the childView function)_.

The machine responds to a _RENDER_ event with a payload of the next rendered component and assigns the payload to `context.view`

If a component depends on the machine's context an _UPDATE_ event is forwarded to the invoked callback containing the machine's context in it's payload. (Changing the selected language is an example of this.)

_ContactUs.tsx_ does not export the React component but only the machine which is invoked when routing to the _Contact Us_ view. The child machine is it's own isolated actor and only sends render updates to the parent. When the invoked machine transitions to it's final state the main machine routes back to home.
