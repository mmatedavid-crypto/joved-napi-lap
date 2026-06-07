import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/horoszkop")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
