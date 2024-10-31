import request from "supertest";
import app from "../src";

describe("Chat Application Flow", () => {

  // Test data
  const testUsers = [
    {
      id: `test-user1-${Date.now()}`,
      name: "John Doe",
      email: `john-${Date.now()}@example.com`,
      avatar: "avatar1.jpg",
    },
    {
      id: `test-user2-${Date.now()}`,
      name: "Jane Smith",
      email: `jane-${Date.now()}@example.com`,
      avatar: "avatar2.jpg",
    },
    {
      id: `test-user3-${Date.now()}`,
      name: "Bob Wilson",
      email: `bob-${Date.now()}@example.com`,
      avatar: "avatar3.jpg",
    },
    {
      id: `test-user4-${Date.now()}`,
      name: "Alice Brown",
      email: `alice-${Date.now()}@example.com`,
      avatar: "avatar4.jpg",
    },
  ];

  let groupChat: {
    id: string;
    type: string;
    name: string;
    members: string[];
    admin: string[];
    createdAt: string;
  };

  beforeAll(async () => {
    // Setup group chat data with dynamic IDs
    groupChat = {
      id: `test-chat-${Date.now()}`,
      type: "group",
      name: "Test Group",
      members: [testUsers[0].id, testUsers[1].id, testUsers[3].id],
      admin: [testUsers[0].id],
      createdAt: new Date().toISOString(),
    };
  });

  describe("1. User Management Flow", () => {
    describe("1.1 User Creation", () => {
      it("should create multiple users successfully", async () => {
        for (const user of testUsers) {
          const response = await request(app)
            .post("/users/createUser")
            .send(user)
            .expect(201);

          console.log(response.body);

          expect(response.body).toMatchObject({
            id: user.id,
            name: user.name,
            email: user.email,
          });
        }
      });

      it("should be able to search for created users", async () => {
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
            ...testUsers[0],
            name: updatedName,
          })
          .expect(200);

        expect(response.body.name).toBe(updatedName);
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
    describe("2.1 Group Chat Creation", () => {
      it("should create a group chat", async () => {
        const response = await request(app)
          .post("/chats/createChat")
          .send(groupChat)
          .expect(201);

        expect(response.body).toMatchObject({
          id: groupChat.id,
          type: "group",
          name: groupChat.name,
        });
        expect(response.body.members).toContain(testUsers[0].id);
        expect(response.body.members).toContain(testUsers[1].id);
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

      it("should list chats for a user", async () => {
        const response = await request(app)
          .post("/chats/getChats")
          .send({ userId: testUsers[0].id })
          .expect(200);

        expect(
          response.body.some((chat: any) => chat.id === groupChat.id)
        ).toBeTruthy();
      });
    });

    describe("2.2 Chat Member Management", () => {
      it("should add a new member to the group", async () => {
        const response = await request(app)
          .post("/chats/addMember")
          .send({
            chatId: groupChat.id,
            member: testUsers[2].id,
          })
          .expect(200);

        expect(response.body.members).toContain(testUsers[2].id);
      });

      it("should remove a member from the group", async () => {
        const response = await request(app)
          .post("/chats/removeMember")
          .send({
            chatId: groupChat.id,
            member: testUsers[2].id,
          })
          .expect(200);

        expect(response.body.members).not.toContain(testUsers[2].id);
      });
    });

    describe("2.3 Message Management", () => {
      let testMessageId: string;

      it("should send a message to the chat", async () => {
        const messageData = {
          chatId: groupChat.id,
          userId: testUsers[0].id,
          message: `Test message ${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "text",
          status: "sent",
          id: `msg_${Date.now()}`,
        };

        const response = await request(app)
          .post("/messages/createMessage")
          .send(messageData);

        expect(response.status).toBe(201);
        testMessageId = response.body.id;
        expect(response.body.message).toBe(messageData.message);
      });

      it("should retrieve chat messages", async () => {
        const response = await request(app)
          .post("/messages/getMessages")
          .send({ chatId: groupChat.id })
          .expect(200);

        expect(Array.isArray(response.body)).toBeTruthy();
        expect(response.body.length).toBeGreaterThan(0);
      });

      it("should get specific message details", async () => {
        const response = await request(app)
          .post("/messages/getMessage")
          .send({ messageId: testMessageId })
          .expect(200);

        expect(response.body.id).toBe(testMessageId);
      });
    });
  });

  describe("3. Cleanup Flow", () => {
    describe("3.1 Chat Deletion", () => {
      it("should delete the group chat", async () => {
        const response = await request(app)
          .delete("/chats/deleteChat")
          .send({ chatId: groupChat.id })
          .expect(200);

        expect(response.body).toEqual({ message: "Chat deleted" });

        // Verify chat is actually deleted
        await request(app)
          .post("/chats/info")
          .send({ chatId: groupChat.id })
          .expect(404);
      });
    });

    describe("3.2 User Deletion", () => {
      it("should delete test users", async () => {
        for (const user of testUsers) {
          const response = await request(app)
            .delete("/users/deleteUser")
            .send({ userId: user.id })
            .expect(200);

          expect(response.body).toEqual({ message: "User deleted" });

          // Verify user is actually deleted
          await request(app)
            .post("/users/getUser")
            .send({ userId: user.id })
            .expect(404);
        }
      });
    });
  });

  describe("4. Error Handling", () => {
    it("should handle user not found", async () => {
      await request(app)
        .post("/users/getUser")
        .send({ userId: "nonexistent-user" })
        .expect(404)
        .expect({ message: "User not found" });
    });

    it("should handle chat not found", async () => {
      await request(app)
        .post("/chats/getChatInfo")
        .send({ chatId: "nonexistent-chat" })
        .expect(404)
        .expect({ message: "Chat not found" });
    });

    it("should handle invalid user data", async () => {
      await request(app)
        .post("/users/getUser")
        .send({
          userId: "invalid-user",
          // Missing required fields
        })
        .expect(404);
    });
  });
});
