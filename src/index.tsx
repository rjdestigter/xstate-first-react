import * as React from "react";
import { render } from "react-dom";

import {
  Machine,
  assign,
  send,
  forwardTo,
  StateNodeConfig,
  Sender
} from "xstate";
import { useMachine } from "@xstate/react";

import App, { Home, UnderConstruction } from "./App";
import { contactUsMachine } from "./ContactUs";

type SimpleEvent<T> = {
  type: T;
};

type RenderEvent = { type: "RENDER"; view: JSX.Element };

type UpdateEvent = { type: "UPDATE"; ctx: MContext };

type MEvent =
  | SimpleEvent<"SIGNIN" | "SIGNUP" | "HOME" | "CONTACT_US" | "TOGGLE_LANG">
  | RenderEvent
  | UpdateEvent;

type MContext = {
  view: JSX.Element;
  lang: "en" | "nl";
};

const childView = (
  render: (ctx: MContext, cb: Sender<any>) => JSX.Element
): StateNodeConfig<MContext, any, MEvent>["invoke"] => {
  return {
    id: "child-view",
    autoForward: true,
    src: (ctx) => (cb, onReceive) => {
      cb({
        type: "RENDER",
        view: render(ctx, cb)
      });

      onReceive((evt) => {
        cb({
          type: "RENDER",
          view: render((evt as UpdateEvent).ctx, cb)
        });
      });
    }
  };
};

const machine = Machine<MContext, MEvent>({
  initial: "home",
  context: {
    view: <></>,
    lang: "en"
  },
  on: {
    RENDER: {
      actions: assign({ view: (_, evt) => evt.view })
    },
    UPDATE: {
      actions: forwardTo("child-view")
    },
    TOGGLE_LANG: {
      actions: [
        assign({
          lang: (ctx) => (ctx.lang === "en" ? "nl" : "en")
        }),
        send((ctx) => ({ type: "UPDATE", ctx }))
      ]
    }
  },
  states: {
    home: {
      invoke: childView((ctx, cb) => (
        <Home
          lang={ctx.lang}
          onSignIn={() => cb("SIGNIN")}
          onSignUp={() => cb("SIGNUP")}
          onContactUs={() => cb("CONTACT_US")}
        />
      )),
      on: {
        SIGNIN: "signin",
        SIGNUP: "signup",
        CONTACT_US: "contactUs"
      }
    },
    signin: {
      on: {
        HOME: "home"
      },
      invoke: childView((ctx, cb) => (
        <UnderConstruction onConfirm={() => cb("HOME")} />
      ))
    },
    contactUs: {
      invoke: {
        id: "child-view",
        src: contactUsMachine,
        onDone: "home"
      }
    },
    signup: {
      on: {
        HOME: "home"
      },
      invoke: childView((ctx, cb) => (
        <UnderConstruction onConfirm={() => cb("HOME")} />
      ))
    }
  }
});

const Main = () => {
  const [state, send] = useMachine(machine);

  return (
    <App lang={state.context.lang} onToggleLang={() => send("TOGGLE_LANG")}>
      {state.context.view}
    </App>
  );
};

const rootElement = document.getElementById("root");

render(<Main />, rootElement);
