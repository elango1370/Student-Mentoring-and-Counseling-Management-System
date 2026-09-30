import { Component } from 'react';

/** Soft glow shown while a 3D scene loads, or when WebGL is unavailable. */
export const SceneFallback = () => (
  <div aria-hidden="true" className="absolute inset-0 grid place-items-center">
    <div className="h-2/3 w-2/3 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.45)_0%,rgba(34,211,238,0.12)_45%,transparent_70%)] blur-xl" />
  </div>
);

/** Keeps a WebGL/Three.js failure from taking the whole page down. */
export class SceneBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.warn('3D scene disabled:', error?.message || error);
  }

  render() {
    return this.state.failed ? <SceneFallback /> : this.props.children;
  }
}
