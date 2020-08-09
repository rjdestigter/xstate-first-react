import * as React from "react";
import { render } from "react-dom";

import { assign, send } from "xstate";
import { useMachine } from "@xstate/react";

import { UIMachine, invokeUI, invokePureUI, updateChild } from "./UIMachine";

import App, { Home, UnderConstruction } from "./App";
import { contactUsMachine } from "./ContactUs";

type SimpleEvent<T> = {
  type: T;
};

type MEvent = SimpleEvent<
  "SIGNIN" | "SIGNUP" | "HOME" | "CONTACT_US" | "TOGGLE_LANG"
>;

type MContext = {
  lang: "en" | "nl";
};

const machine = UIMachine<MContext, MEvent>(
  {
    initial: "home",
    context: {
      lang: "en"
    },
    on: {
      TOGGLE_LANG: {
        actions: [
          assign({
            lang: (ctx) => (ctx.lang === "en" ? "nl" : "en")
          }),
          updateChild
        ]
      }
    },
    states: {
      home: {
        invoke: invokeUI((ctx, cb) => (
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
        invoke: invokePureUI((ctx, cb) => (
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
        invoke: invokePureUI((ctx, cb) => (
          <UnderConstruction onConfirm={() => cb("HOME")} />
        ))
      }
    }
  },
  {
    isRoot: true
  }
);

const Main = () => {
  const [state, send, service] = useMachine(machine);

  React.useEffect(() => {
    service.onTransition((state) => {
      console.log(state);
    });
  }, [service]);

  return (
    <App lang={state.context.lang} onToggleLang={() => send("TOGGLE_LANG")}>
      {state.context._view}
    </App>
  );
};

const rootElement = document.getElementById("root");

render(<Main />, rootElement);
