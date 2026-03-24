import type { MockServerConfig } from "mock-config-server";

import { createMockServer, startMockServer } from "mock-config-server";

export const mockServerConfig: MockServerConfig = [
  {
    configs: [
      {
        event: "get-users",
        routes: [
          {
            event: (request, entities) => {
              const emojiFromMessage =
                typeof entities.message === "object" &&
                entities.message &&
                !Array.isArray(entities.message) &&
                "emoji" in entities.message
                  ? (entities.message.emoji as string)
                  : undefined;

              return {
                users: [{ id: 1, emoji: emojiFromMessage ?? "🎉" }],
                host: request.headers.host,
              };
            },
          },
        ],
      },
    ],
  },
];

createMockServer(mockServerConfig);
startMockServer(mockServerConfig);
