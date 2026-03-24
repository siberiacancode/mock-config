import type { MockServerConfig } from "mock-config-server";

import { createMockServer, startMockServer } from "mock-config-server";

export const mockServerConfig: MockServerConfig = [
  {
    configs: [
      {
        event: "get-users",
        routes: [
          {
            event: {
              users: [{ id: 1, emoji: "🎉" }],
            },
          },
          {
            event: {
              users: [{ id: 2, emoji: "🔥" }],
            },
            entities: {
              message: {
                emoji: "🔥",
              },
            },
          },
        ],
      },
      {
        event: "get-user",
        routes: [
          {
            event: { id: 1, emoji: "🎉" },
          },
          {
            event: { id: 2, emoji: "🔥" },
            entities: {
              message: {
                id: 2,
              },
            },
          },
        ],
      },
    ],
  },
];

createMockServer(mockServerConfig);
startMockServer(mockServerConfig);
