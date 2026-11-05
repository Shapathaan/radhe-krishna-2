import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(err) { console.error('[3D master plan]', err) }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}
