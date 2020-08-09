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
      cb(renderEvt(render(ctx, cb)));

      !options.ignoreUpdates &&
        onReceive((evt) => {
          cb(renderEvt(render((evt as UpdateEvent<TContext>).context, cb)));
        });
    }
  };
};

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
