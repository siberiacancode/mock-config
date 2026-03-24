import type { MockServerConfig } from "mock-config-server";

import { createMockServer, startMockServer } from "mock-config-server";

export const mockServerConfig: MockServerConfig = [
  {
    configs: [
      {
        event: /get-(users|accounts)/,
        routes: [
          {
            event: [{ id: 1, emoji: "🎉" }],
          },
          {
            event: [{ id: 2, emoji: "🔥" }],
            entities: {
              message: {
                emoji: "🔥",
              },
            },
          },
        ],
      },
      {
        event: /get-(user|account)/,
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
      {
        event: /delete-(user|account)/,
        routes: [
          {
            event: { success: true },
          },
          {
            event: { success: false },
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
