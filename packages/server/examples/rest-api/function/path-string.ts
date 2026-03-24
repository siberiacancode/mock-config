import type { MockServerConfig } from "mock-config-server";

import { createMockServer, startMockServer } from "mock-config-server";

export const mockServerConfig: MockServerConfig = [
  {
    configs: [
      {
        method: "get",
        path: "/users",
        routes: [
          {
            data: (request, entities) => {
              const emojiFromQuery = entities.query?.emoji;
              const authHeader = request.headers.authorization;

              return {
                users: [{ id: 1, emoji: emojiFromQuery ?? "🎉" }],
                authorized: typeof authHeader === "string",
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
