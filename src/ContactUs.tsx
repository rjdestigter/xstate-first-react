import * as React from "react";
import {
  Machine,
  Sender,
  StateNodeConfig,
  assign,
  AnyEventObject,
  sendParent
} from "xstate";
import { log } from "xstate/lib/actions";

type MContext = {
  view: JSX.Element;
};

type RenderEvent = { type: "RENDER"; view: JSX.Element };

type MEvent = RenderEvent | { type: "SEND" };

const childView = (
  render: (ctx: MContext, cb: Sender<any>) => JSX.Element
): StateNodeConfig<MContext, any, AnyEventObject>["invoke"] => {
  return {
    id: "child-view",
    autoForward: true,
    src: (ctx) => (cb) => {
      cb({
        type: "RENDER",
        view: render(ctx, cb)
      });
    }
  };
};

type propsContactUs = {
  sending?: boolean;
  onSend?: () => void;
};

const ContactUs = (props: propsContactUs) => {
  return (
    <div>
      {props.sending ? "... sending your mesage" : null}
      <hr />
      <textarea disabled={props.sending} defaultValue="" />
      <br />
      <br />
      <button disabled={props.sending} onClick={props.onSend}>
        Send
      </button>
    </div>
  );
};

export const contactUsMachine = Machine<MContext, MEvent>({
  initial: "editing",
  context: {
    view: <ContactUs />
  },
  on: {
    RENDER: {
      actions: [
        assign({ view: (_, evt) => (evt as RenderEvent).view }),
        sendParent((_, evt) => evt)
      ]
    }
  },
  states: {
    editing: {
      on: {
        SEND: {
          target: "sending",
          actions: log("Sending")
        }
      },
      invoke: childView((_, cb) => <ContactUs onSend={() => cb("SEND")} />)
    },
    sending: {
      invoke: [
        childView((_, cb) => <ContactUs sending />),
        {
          src: () => new Promise((resolve) => setTimeout(resolve, 1500)),
          onDone: "done"
        }
      ]
    },
    done: {
      type: "final"
    }
  }
});
