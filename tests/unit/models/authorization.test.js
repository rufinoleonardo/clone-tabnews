const { InternalServerError } = require("infra/errors");
const { default: authorization } = require("models/authorization");

describe("models/authorization.js", () => {
  describe("1) .can()", () => {
    test("a) without `user`", () => {
      expect(() => {
        authorization.can();
      }).toThrow(InternalServerError);
    });

    test("b) with user but not feature", () => {
      const createdUser = { username: "userb" };

      expect(() => {
        authorization.can(createdUser);
      }).toThrow(InternalServerError);
    });

    test("c) with invalid feature", () => {
      const createdUser = { username: "userC", features: ["create:table"] };

      expect(() => {
        authorization.can(createdUser, "create:table");
      }).toThrow(InternalServerError);
    });

    test("d) with `user` and valid `feature`", () => {
      const createdUserD = { username: "userD", features: ["create:user"] };

      expect(authorization.can(createdUserD, "create:user")).toBe(true);
    });
  });

  describe("2) .filterOutput()", () => {
    test("a) without `user`", () => {
      expect(() => {
        authorization.filterOutput();
      }).toThrow(InternalServerError);
    });

    test("b) with user but not feature", () => {
      const createdUser = { username: "userb" };

      expect(() => {
        authorization.filterOutput(createdUser);
      }).toThrow(InternalServerError);
    });

    test("c) with invalid feature", () => {
      const createdUser = { username: "userC", features: ["create:table"] };

      expect(() => {
        authorization.filterOutput(createdUser, "create:table");
      }).toThrow(InternalServerError);
    });

    test("d) with `user`, valid `feature` but not resource", () => {
      const createdUserD = { username: "userD", features: ["read:user"] };

      expect(() =>
        authorization.filterOutput(createdUserD, "read:user"),
      ).toThrow(InternalServerError);
    });

    test("e) with all required params", () => {
      const userE = { username: "userE", features: ["read:user"] };
      const resource = {
        id: 1,
        username: "resourceUsre",
        features: ["read:user", "create:user"],
        created_at: "2026-01-01T00.00.00.000Z",
        updated_at: "2026-01-01T00.00.00.000Z",
        email: "resource@email.com",
        password: "resource",
      };

      console.log(userE, resource);

      expect(authorization.filterOutput(userE, "read:user", resource)).toEqual({
        id: 1,
        username: "resourceUsre",
        features: ["read:user", "create:user"],
        created_at: "2026-01-01T00.00.00.000Z",
        updated_at: "2026-01-01T00.00.00.000Z",
      });
    });
  });
});
