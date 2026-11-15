
export interface HomepageGreeting {
  title: string;
  subtitle: string;
}

export function getHomepageGreeting(
  date: Date = new Date(),
): HomepageGreeting {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return {
      title: "Good morning.",
      subtitle: "What are we working on today?",
    };
  }

  if (hour >= 12 && hour < 17) {
    return {
      title: "Good afternoon.",
      subtitle: "Let's see what's on the agenda for today.",
    };
  }

  if (hour >= 17 && hour < 21) {
    return {
      title: "Good evening.",
      subtitle: "Let's wrap up the important things.",
    };
  }

  return {
    title: "Still making progress?",
    subtitle: "Here's what's happening with your workspace.",
  };
}
