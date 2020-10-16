---
id: version-0.25.0-number-guess-game
title: Number Guess Game
original_id: number-guess-game
---

This is a simple game where you need to guess a random number to win. We use it to show different features of TSDI and how to setup a project.

## tl;dr

We have a [CodeSandbox](https://codesandbox.io/s/tsdi-number-guess-game-ynq7d) where you can see all this in action.

<iframe src="https://codesandbox.io/embed/tsdi-number-guess-game-ynq7d?fontsize=14&hidenavigation=1&theme=dark&view=editor&module=/src/container.ts,/src/game.ts,/src/app.tsx"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="TSDI  Number Guess Game"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>

## Setup

For this game we use React and MobX to do the rendering and state management. And we use TSDI to glue the gaps between.
The app is bundled using parcel.

### Metadata

Create a `package.json` file with the following content:

> A bit special here might be the `index.html` as value of the `main` attribute. This is take by parcel.

```json
{
  "name": "tsdi-number-guess-game",
  "version": "1.0.0",
  "description": "",
  "main": "index.html",
  "scripts": {
    "start": "parcel index.html --open",
    "build": "parcel build index.html"
  },
  "dependencies": {
    "mobx": "6.0.1",
    "mobx-react": "7.0.0",
    "react": "16.13.1",
    "react-dom": "16.13.1",
    "reflect-metadata": "0.1.13",
    "tsdi": "0.23.0"
  },
  "devDependencies": {
    "@types/react": "16.9.51",
    "@types/react-dom": "16.9.8",
    "parcel-bundler": "^1.6.1",
    "prettier": "2.1.2",
    "typescript": "4.0.3"
  },
  "keywords": [],
  "prettier": {}
}
```

Then run yarn and setup typescript:

```
$ yarn
$ yarn tsc -init
```

Change the content of `tsconfig.json` to:

```json
{
  "compilerOptions": {
    "strict": true,
    "module": "ESNext",
    "target": "es2018",
    "jsx": "react",
    "esModuleInterop": true,
    "sourceMap": true,
    "allowJs": true,
    "lib": ["es6", "dom"],
    "rootDir": "src",
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

- We use `esnext` as module output here to enable parcel tree-shaking
- We only want to support newer browses (target `es2018`)
- The important bits here are `experimentalDecorators` and `emitDecoratorMetadata` to add required information for TSDI into the transpiled sources.

### HTML

Create the `index.html` referenced in the `package.json` with the following content:

```html
<html>
  <head>
    <title>Parcel Sandbox</title>
    <meta charset="UTF-8" />
  </head>

  <body>
    <div id="app"></div>
    <script src="src/index.tsx"></script>
  </body>
</html>
```

There is nothing special in this file. The added script here will be transpiled and replaced with the bundled by parcel.

### React

Create a `src/index.tsx` file and let React render the application:

```ts
// This import is required by TSDI and should be added once for your project
import 'reflect-metadata';

import * as React from 'react';
import { render } from 'react-dom';

import { App } from './app';

render(<App />, document.getElementById('app'));
```

## Game Files

### Container

`src/container.ts`

To setup TSDI we just call the constructor. To automatically register all components into this container we also call `enableComponentScanner` on the instance.

We do create a custom React hook here (`useTSDI`) to make the container available to function components.
We could also directly use the exported container instance since the management of state is done by the container. But a custom hook might be more natural to react users.

```ts
import { Constructable, TSDI } from 'tsdi';

export const tsdi = new TSDI();
tsdi.enableComponentScanner();

export const useTSDI = <T>(component: Constructable<T>): T => {
  return tsdi.get(component);
};
```

### Game

`src/game.ts`

This is the game logic. It holds the random number to guess and the current state of the game. This includes the current guess, the history of tries and the current comparison state.

We use MobX here to create our state and derived properties.

```ts
import { component, initialize } from 'tsdi';
import { action, computed, makeObservable, observable } from 'mobx';

export enum State {
  undefined, // freshly started game, no guess available
  smaller, // the random number is smaller to the guess
  bigger, // the random number is bigger to the guess
  equal, // the random number is equal to the guess
}

// this decorator makes the component managed by TSDI
@component
export class Game {
  @observable
  public numerOfGames = -1; // used to reset the game state

  @observable
  private number = -1;

  @observable
  private guess = -1;

  @observable
  public readonly tries: number[] = [];

  @computed
  public get state(): State {
    if (this.tries.length === 0) {
      return State.undefined;
    } else if (this.number < this.guess) {
      return State.smaller;
    } else if (this.number > this.guess) {
      return State.bigger;
    } else {
      return State.equal;
    }
  }

  constructor() {
    makeObservable(this);
  }

  // this method is called as soon as TSDI created the game
  @initialize
  protected init(): void {
    this.reset();
  }

  @action
  public onGuess(value: string): void {
    this.guess = Number(value);
    this.tries.push(this.guess);
  }

  @action
  public reset(): void {
    this.tries.splice(0, this.tries.length);
    this.number = Math.ceil(Math.random() * 100);
    this.guess = -1;
    this.numerOfGames++;
  }
}
```

### Application

`src/app.tsx`

The application shows the usage of injecting TSDI components into React components (in this case class components).

We are injecting our main `Game` instance into our UI to render the current game state.

The `App` component is marked as `@external` and `@observable`.

```ts
import * as React from 'react';
import { external, inject } from 'tsdi';
import { observer } from 'mobx-react';

import { Game } from './game';
import { GuessInput } from './guess-input';
import { GuessState } from './guess-state';

@observer
// this connects the react component to the TSDI injection container.
// we cannot use @component here, since react takes care of the lifecycle of
// components instead of the injection container.
@external
export class App extends React.Component {
  // let TSDI inject (and if not available yet create it) the game instance
  @inject
  private game!: Game;

  public render(): React.ReactNode {
    return (
      <div>
        <p>Please guess a number between 0 and 100!</p>
        <div>
          Your guess:
          <GuessInput key={this.game.numerOfGames} />
        </div>
        <GuessState />
        <ol>
          {this.game.tries.map((number, idx) => (
            <li key={idx}>{number}</li>
          ))}
        </ol>
      </div>
    );
  }
}
```

### Guess Input

`src/guess-input.tsx`

This is our guess input component which takes the users guess and triggers a new comparison.

It is implemented as React function component.

```ts
import * as React from 'react';

import { useTSDI } from './container';
import { Game } from './game';

export const GuessInput = () => {
  // use a local state here to manage intermediate user input
  const [local, setLocal] = React.useState<string>('');
  // use our custom react hook to get access to our game instance
  const game = useTSDI(Game);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        game.onGuess(local);
      }}
    >
      <input
        type="number"
        value={local}
        onChange={(e) => setLocal(e.currentTarget.value)}
      />
      <button type="submit">Try!</button>
    </form>
  );
};
```

### Guess State

`src/guess-state.tsx`

This display the current guess comparison state to the user and in case of
a match, we are able to start a new game.

```ts
import * as React from 'react';
import { observer } from 'mobx-react';

import { useTSDI } from './container';
import { Game, State } from './game';

export const GuessState = observer(() => {
  // use our custom react hook to get access to our game instance
  const game = useTSDI(Game);

  switch (game.state) {
    case State.bigger:
      return <>My number is bigger</>;
    case State.equal:
      return (
        <>
          Congratulations!!!{' '}
          <button onClick={() => game.reset()}>Restart</button>
        </>
      );
    case State.smaller:
      return <>My number is smaller</>;
  }

  return null;
});
```

## Additional explanations

It might be confusing to mix class components and function components here. This is done to show the flexibility of TSDI here.

Also the number guess game is fairly easy and wouldn't require any state management solution (TSDI + MobX) at all. Take this only as a showcase for more complex cases.

**Note:** TSDI is not limited to the combination of React and MobX, but since MobX supports decorators this is a natural fit for us.

TSDI is a general purpose DI container and could be used without any of the referenced libraries in this example.
