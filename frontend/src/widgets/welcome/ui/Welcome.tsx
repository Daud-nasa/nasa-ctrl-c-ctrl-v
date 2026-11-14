import { Button } from '@shared/ui/Button'

export function Welcome() {
  return (
    <section className="welcome">
      <p className="eyebrow">Feature-Sliced Design · Vite · TypeScript</p>
      <h1>Your app starts here.</h1>
      <p className="description">
        The project is organized by business responsibility, so features can grow
        without turning the codebase into a dependency maze.
      </p>
      <Button>Explore the architecture</Button>
    </section>
  )
}
