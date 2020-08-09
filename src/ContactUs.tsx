import * as React from "react";

import { log } from "xstate/lib/actions";

import { UIMachine, invokePureUI } from "./UIMachine";

type MEvent = { type: "SEND" };

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

export const contactUsMachine = UIMachine<{}, MEvent>({
  initial: "editing",
  states: {
    editing: {
      on: {
        SEND: {
          target: "sending",
          actions: log("Sending")
        }
      },
      invoke: invokePureUI((_, cb) => <ContactUs onSend={() => cb("SEND")} />)
    },
    sending: {
      invoke: [
        invokePureUI((_, cb) => <ContactUs sending />),
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
