import * as React from "react";
import "./styles.scss";

export default function App(props: {
  lang: "en" | "nl";
  onToggleLang: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <div>{props.children}</div>
      <hr />
      <button onClick={props.onToggleLang}>
        Talk to me in: {props.lang === "nl" ? "English" : "Dutch"}
      </button>
    </div>
  );
}

type propsHome = {
  lang: "en" | "nl";
  onSignIn: () => void;
  onSignUp: () => void;
  onContactUs: () => void;
};

export const Home = (props: propsHome) => {
  return (
    <>
      <h1>
        {props.lang === "en"
          ? "Where do you want to go today?"
          : "Zeg moeder waar is Jan?"}
      </h1>
      <button onClick={props.onSignIn}>Sign In</button>
      <br />
      <br />
      <button onClick={props.onSignUp}>Sign Up</button>
      <br />
      <br />
      <button onClick={props.onContactUs}>Contact Us</button>
    </>
  );
};

type propsUnderConstruction = {
  onConfirm: () => void;
};

export const UnderConstruction = (props: propsUnderConstruction) => {
  return (
    <>
      <h2>Under Construction</h2>
      <button onClick={props.onConfirm}>Go back</button>
    </>
  );
};
