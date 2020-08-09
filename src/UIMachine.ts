import {
  Machine,
  EventObject,
  AnyEventObject,
  Sender,
  StateNodeConfig,
  MachineConfig,
  MachineOptions,
  StateMachine,
  assign,
  forwardTo,
  send,
  sendParent
} from "xstate";

type RenderEvent = {
  type: "@react-ui-machine/RENDER";
  component: JSX.Element;
};

type UpdateEvent<TContext> = {
  type: "@react-ui-machine/UPDATE";
  context: TContext;
};

export const renderEvt = (component: JSX.Element): RenderEvent => ({
  type: "@react-ui-machine/RENDER",
  component
});

export const updateChild = send((context) => ({
  type: "@react-ui-machine/UPDATE",
  context
  // to: "@react-ui-machine/child-ui"
}));

/**
 * Create the configuration of an invoked callback that provides the
 * machine with a rendered compnent.
 *
 * @param render  Given the machine's state and dispatch/send function returns a rendered ReactJS components
 * @param options.ignoreUpdates Set to true if state context updates are not important to the component.
 */
export const invokeUI = <
  TContext = any,
  TEvent extends EventObject = AnyEventObject
>(
  render: (ctx: TContext, cb: Sender<any>) => JSX.Element,
  options: {
    ignoreUpdates?: boolean;
  } = {}
): StateNodeConfig<TContext, any, TEvent | UpdateEvent<TContext>>["invoke"] => {
  return {
    id: "@react-ui-machine/child-ui",
    src: (ctx) => (cb, onReceive) => {
      // Execute invoked callback with first render
      cb(renderEvt(render(ctx, cb)));

      // If needed, execute callback with inbcoming context updates
      !options.ignoreUpdates &&
        onReceive((evt) => {
          cb(renderEvt(render((evt as UpdateEvent<TContext>).context, cb)));
        });
    }
  };
};

/**
 * Identical to [[invokeUI]] but sets `ignoreUpdates` to `true`
 */
export const invokePureUI = <
  TContext = any,
  TEvent extends EventObject = AnyEventObject
>(
  render: (ctx: TContext, cb: Sender<any>) => JSX.Element,
  options: {
    ignoreUpdates?: boolean;
  } = {}
) =>
  invokeUI(render, {
    ...options,
    ignoreUpdates: true
  });

export type UIContext = {
  _view: JSX.Element | null;
};

export type UIEvent<TContext> = RenderEvent | UpdateEvent<TContext>;

/**
 * Wrapper around xstate.Machine that adds context and event configuration
 * for storing rendered ReactJS component on the machine's context object.
 *
 * Set `options.isRoot` to `true` if this machine should not send updates
 * to any parent machines. Other than that see [[Machine]]
 */
export const UIMachine = <
  TContext = any,
  TEvent extends EventObject = AnyEventObject
>(
  config: MachineConfig<TContext, any, TEvent>,
  options?: Partial<MachineOptions<TContext, TEvent>> & { isRoot?: boolean },
  initialContext?: TContext
): StateMachine<
  TContext & UIContext,
  any,
  TEvent | UIEvent<TContext & UIContext>
> => {
  const context = () =>
    typeof config.context === "function"
      ? Object.assign({}, (config.context as () => TContext)() || {}, {
          _view: null
        })
      : config.context == null
      ? { _view: null }
      : Object.assign({}, config.context, { _view: null });

  const nextConfig = {
    ...config,
    context,
    on: {
      ...(config.on || {}),
      "@react-ui-machine/RENDER": {
        actions: [
          assign({ _view: (_, evt) => (evt as RenderEvent).component }),
          options?.isRoot ? () => {} : sendParent((ctx) => renderEvt(ctx._view))
        ]
      },
      "@react-ui-machine/UPDATE": {
        actions: forwardTo("@react-ui-machine/child-ui")
      }
    }
  };

  return Machine(
    nextConfig as any,
    options as any,
    (initialContext
      ? { ...initialContext, _view: null }
      : initialContext) as any
  );
};
