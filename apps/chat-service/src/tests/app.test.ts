import request from "supertest";
import app from "..";

describe("Chat Application Flow", () => {
  // Test data
  const testUsers = [
    {
      id: `test-user1-${Date.now()}`,
      name: "John Doe",
      email: `john-${Date.now()}@example.com`,
      avatar_url: "avatar1.jpg",
    },
    {
      id: `test-user2-${Date.now()}`,
      name: "Jane Smith",
      email: `jane-${Date.now()}@example.com`,
      avatar_url: "avatar2.jpg",
    },
    {
      id: `test-user3-${Date.now()}`,
      name: "Bob Wilson",
      email: `bob-${Date.now()}@example.com`,
      avatar_url: "avatar3.jpg",
    },
    {
      id: `test-user4-${Date.now()}`,
      name: "Alice Brown",
      email: `alice-${Date.now()}@example.com`,
      avatar_url: "avatar4.jpg",
    },
  ];

  let groupChat: {
    id: string;
    type: string;
    name: string;
    avatar_url?: string;
    created_by: string;
    created_at: string;
  };

  beforeAll(async () => {
    // Setup group chat data
    groupChat = {
      id: `test-chat-${Date.now()}`,
      type: "group",
      name: "Test Group",
      avatar_url: "group-avatar.jpg",
      created_by: testUsers[0].id,
      created_at: new Date().toISOString(),
    };
  });

  describe("1. User Management Flow", () => {
    describe("1.1 User Creation and Retrieval", () => {
      it("should create multiple users successfully", async () => {
        for (const user of testUsers) {
          const response = await request(app)
            .post("/users/createUser")
            .send(user)
            .expect(201);

          expect(response.body).toMatchObject({
            id: user.id,
            name: user.name,
            email: user.email,
          });
        }
      });

      it("should search for created users", async () => {
        const response = await request(app)
          .post("/users/searchUsers")
          .send({ query: testUsers[0].name })
          .expect(200);

        expect(response.body.length).toBeGreaterThanOrEqual(1);
        expect(
          response.body.some((user: any) => user.id === testUsers[0].id)
        ).toBeTruthy();
      });
    });

    describe("1.2 User Profile Management", () => {
      it("should update user profile", async () => {
        const updatedName = `Updated Name ${Date.now()}`;
        const response = await request(app)
          .put("/users/updateUser")
          .send({
            id: testUsers[0].id,
            name: updatedName,
            email: testUsers[0].email,
            avatar_url: testUsers[0].avatar_url,
          })
          .expect(200);

        expect(response.body.name).toBe(updatedName);
      });

      it("should update user's last seen", async () => {
        await request(app)
          .put("/users/updateLastSeen")
          .send({ userId: testUsers[0].id })
          .expect(200);
      });

      it("should get user profile", async () => {
        const response = await request(app)
          .post("/users/getUser")
          .send({ userId: testUsers[0].id })
          .expect(200);

        expect(response.body.id).toBe(testUsers[0].id);
      });
    });
  });

  describe("2. Chat Management Flow", () => {
    describe("2.1 Chat Creation and Retrieval", () => {
      it("should create a group chat", async () => {
        const response = await request(app)
          .post("/chats/createChat")
          .send({
            ...groupChat,
            participants: [
              { user_id: testUsers[0].id, role: "owner" },
              { user_id: testUsers[1].id, role: "member" },
              { user_id: testUsers[3].id, role: "member" },
            ],
          })
          .expect(201);

        expect(response.body).toMatchObject({
          id: expect.any(String),
          type: "group",
          name: groupChat.name,
        });
        groupChat.id = response.body.id; // Update with actual ID
      });

      it("should get chat information", async () => {
        const response = await request(app)
          .post("/chats/getChatInfo")
          .send({ chatId: groupChat.id })
          .expect(200);

        expect(response.body).toMatchObject({
          id: groupChat.id,
          type: "group",
          name: groupChat.name,
        });
      });

      it("should list user's chats", async () => {
        const response = await request(app)
          .post("/chats/getUserChats")
          .send({ userId: testUsers[0].id })
          .expect(200);

        expect(
          response.body.some((chat: any) => chat.id === groupChat.id)
        ).toBeTruthy();
      });
    });

    describe("2.2 Chat Participant Management", () => {
      it("should add a participant to the chat", async () => {
        const response = await request(app)
          .post("/chats/addParticipant")
          .send({
            chatId: groupChat.id,
            userId: testUsers[2].id,
            role: "member",
          })
          .expect(200);

        const chatInfo = await request(app)
          .post("/chats/getChatInfo")
          .send({ chatId: groupChat.id });
        
        expect(chatInfo.body.participants.some((p: any) => p.user_id === testUsers[2].id)).toBeTruthy();
      });

      it("should remove a participant from the chat", async () => {
        const response = await request(app)
          .post("/chats/removeParticipant")
          .send({
            chatId: groupChat.id,
            userId: testUsers[2].id,
          })
          .expect(200);

        const chatInfo = await request(app)
          .post("/chats/getChatInfo")
          .send({ chatId: groupChat.id });
        
        expect(chatInfo.body.participants.some((p: any) => p.user_id === testUsers[2].id)).toBeFalsy();
      });
    });

    describe("2.3 Message Management", () => {
      let testMessageId: string;

      it("should send a message to the chat", async () => {
        const messageData = {
          chat_id: groupChat.id,
          sender_id: testUsers[0].id,
          content: `Test message ${Date.now()}`,
          type: "text",
        };

        const response = await request(app)
          .post("/messages/sendMessage")
          .send(messageData)
          .expect(201);

        testMessageId = response.body.id;
        expect(response.body.content).toBe(messageData.content);
      });

      it("should get chat messages", async () => {
        const response = await request(app)
          .post("/messages/getChatMessages")
          .send({ chatId: groupChat.id })
          .expect(200);
        console.log(response.body);
        expect(Array.isArray(response.body)).toBeTruthy();
        expect(response.body.length).toBeGreaterThan(0);
      });

      it("should mark messages as read", async () => {
        await request(app)
          .put("/messages/markMessageAsRead")
          .send({ 
            messageId: testMessageId,
            userId: testUsers[1].id
          })
          .expect(200);
      });

    });
  });

  describe("3. Cleanup Flow", () => {
    describe("3.1 Chat Deletion", () => {
      it("should delete the chat", async () => {
        await request(app)
          .delete("/chats/deleteChat")
          .send({ chatId: groupChat.id })
          .expect(200);

        // Verify chat is deleted
        await request(app)
          .post("/chats/getChatInfo")
          .send({ chatId: groupChat.id })
          .expect(404);
      });
    });

    describe("3.2 User Deletion", () => {
      it("should delete test users", async () => {
        for (const user of testUsers) {
          await request(app)
            .delete("/users/deleteUser")
            .send({ userId: user.id })
            .expect(200);

          // Verify user is deleted
          await request(app)
            .post("/users/getUser")
            .send({ userId: user.id })
            .expect(404);
        }
      });
    });
  });

  describe("4. Error Handling", () => {
    it("should handle nonexistent user", async () => {
      await request(app)
        .post("/users/getUser")
        .send({ userId: "nonexistent-user" })
        .expect(404);
    });

    it("should handle nonexistent chat", async () => {
      await request(app)
        .post("/chats/getChatInfo")
        .send({ chatId: "32f5c30f-a674-48b7-a39a-bdb9a074392e" })
        .expect(404);
    });

    it("should handle missing required fields", async () => {
      await request(app)
        .post("/users/createUser")
        .send({
          // Missing required fields
          name: "Test User"
        })
        .expect(400);
    });
  });
});