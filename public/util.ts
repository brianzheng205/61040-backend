type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type InputTag = "input" | "textarea" | "json";
type Field = InputTag | { [key: string]: Field };
type Fields = Record<string, Field>;

type Operation = {
  name: string;
  endpoint: string;
  method: HttpMethod;
  fields: Fields;
};

/**
 * This list of operations is used to generate the manual testing UI.
 */
const operations: Operation[] = [
  {
    name: "Get Session User (logged in user)",
    endpoint: "/api/session",
    method: "GET",
    fields: {},
  },
  {
    name: "Get Users (empty for all)",
    endpoint: "/api/users/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Create User",
    endpoint: "/api/users",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Update Username",
    endpoint: "/api/users/username",
    method: "PATCH",
    fields: { username: "input" },
  },
  {
    name: "Update Password",
    endpoint: "/api/users/password",
    method: "PATCH",
    fields: { currentPassword: "input", newPassword: "input" },
  },
  {
    name: "Delete User",
    endpoint: "/api/users",
    method: "DELETE",
    fields: {},
  },
  {
    name: "Log In",
    endpoint: "/api/login",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Log Out",
    endpoint: "/api/logout",
    method: "POST",
    fields: {},
  },
  {
    name: "Get Posts (empty for all)",
    endpoint: "/api/posts",
    method: "GET",
    fields: { author: "input" },
  },
  {
    name: "Create Post",
    endpoint: "/api/posts",
    method: "POST",
    fields: { isLinked: "input", content: "input" },
  },
  {
    name: "Update Post",
    endpoint: "/api/posts/:id",
    method: "PATCH",
    fields: { id: "input", content: "input", options: { backgroundColor: "input" } },
  },
  {
    name: "Delete Post",
    endpoint: "/api/posts/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Get Friends",
    endpoint: "/api/friends",
    method: "GET",
    fields: {},
  },
  {
    name: "Remove Friend",
    endpoint: "/api/friends/:friend",
    method: "DELETE",
    fields: { friend: "input" },
  },
  {
    name: "Get Friend Requests",
    endpoint: "/api/friend/requests",
    method: "GET",
    fields: {},
  },
  {
    name: "Send Friend Request",
    endpoint: "/api/friend/requests/:to",
    method: "POST",
    fields: { to: "input" },
  },
  {
    name: "Remove Friend Request",
    endpoint: "/api/friend/requests/:to",
    method: "DELETE",
    fields: { to: "input" },
  },
  {
    name: "Accept Friend Request",
    endpoint: "/api/friend/accept/:from",
    method: "PUT",
    fields: { from: "input" },
  },
  {
    name: "Reject Friend Request",
    endpoint: "/api/friend/reject/:from",
    method: "PUT",
    fields: { from: "input" },
  },
  {
    name: "Get Comments (empty for all)",
    endpoint: "/api/comments",
    method: "GET",
    fields: { author: "input" },
  },
  {
    name: "Create Comment",
    endpoint: "/api/comments",
    method: "POST",
    fields: { isLinked: "input", postId: "input", content: "input" },
  },
  {
    name: "Update Comment",
    endpoint: "/api/comments/:id",
    method: "PATCH",
    fields: { id: "input", content: "input" },
  },
  {
    name: "Delete Comment",
    endpoint: "/api/comments/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Get Links (empty for all)",
    endpoint: "/api/links",
    method: "GET",
    fields: { user: "input" },
  },
  {
    name: "Get User-Post Links (empty for all)",
    endpoint: "/api/links/posts",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Create User-Post Link",
    endpoint: "/api/links/posts",
    method: "POST",
    fields: { postId: "input" },
  },
  {
    name: "Delete User-Post Link",
    endpoint: "/api/links/posts/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Get User-Comment Links (empty for all)",
    endpoint: "/api/links/comments",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Create User-Comment Link",
    endpoint: "/api/links/comments",
    method: "POST",
    fields: { commentId: "input" },
  },
  {
    name: "Delete User-Comment Link",
    endpoint: "/api/links/comments/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Get User-Data Links (empty for all)",
    endpoint: "/api/links/data",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Create User-Data Link",
    endpoint: "/api/links/data",
    method: "POST",
    fields: { dataId: "input" },
  },
  {
    name: "Delete User-Data Link",
    endpoint: "/api/links/data/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Get User-Competition Links (empty for all)",
    endpoint: "/api/links/competitions",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Create User-Competition Link",
    endpoint: "/api/links/competitions",
    method: "POST",
    fields: { competitionId: "input" },
  },
  {
    name: "Delete User-Competition Link",
    endpoint: "/api/links/competitions/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Get Data (empty for all, only use one of date or dateRange, sort is either score or date)",
    endpoint: "/api/data",
    method: "GET",
    fields: { username: "input", date: "input", dateRange: "input", sort: "input" },
  },
  {
    name: "Log Data",
    endpoint: "/api/data",
    method: "POST",
    fields: { isLinked: "input", date: "input", score: "input" },
  },
  {
    name: "Update Data",
    endpoint: "/api/data/:id",
    method: "PATCH",
    fields: { id: "input", date: "input", score: "input" },
  },
  {
    name: "Delete Data",
    endpoint: "/api/data/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Get Competitions (empty for all)",
    endpoint: "/api/competitions",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Create Competition",
    endpoint: "/api/competitions",
    method: "POST",
    fields: { isLinked: "input", name: "input", endDate: "input" },
  },
  {
    name: "Update Competition",
    endpoint: "/api/competitions/:name",
    method: "PATCH",
    fields: { name: "input", newName: "input", owner: "input", endDate: "input" },
  },
  {
    name: "Delete Competition",
    endpoint: "/api/competitions/:name",
    method: "DELETE",
    fields: { name: "input" },
  },
  {
    name: "Get Competition Members",
    endpoint: "/api/competitions/:name/users",
    method: "GET",
    fields: { name: "input" },
  },
  {
    name: "Join Competition",
    endpoint: "/api/competitions/:name/users",
    method: "POST",
    fields: { name: "input" },
  },
  {
    name: "Leave Competition",
    endpoint: "/api/competitions/:name/users",
    method: "DELETE",
    fields: { name: "input" },
  },
];

/*
 * You should not need to edit below.
 * Please ask if you have questions about what this test code is doing!
 */

function updateResponse(code: string, response: string) {
  document.querySelector("#status-code")!.innerHTML = code;
  document.querySelector("#response-text")!.innerHTML = response;
}

async function request(method: HttpMethod, endpoint: string, params?: unknown) {
  try {
    if (method === "GET" && params) {
      endpoint += "?" + new URLSearchParams(params as Record<string, string>).toString();
      params = undefined;
    }

    const res = fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: params ? JSON.stringify(params) : undefined,
    });

    return {
      $statusCode: (await res).status,
      $response: await (await res).json(),
    };
  } catch (e) {
    console.log(e);
    return {
      $statusCode: "???",
      $response: { error: "Something went wrong, check your console log.", details: e },
    };
  }
}

function fieldsToHtml(fields: Record<string, Field>, indent = 0, prefix = ""): string {
  return Object.entries(fields)
    .map(([name, tag]) => {
      const htmlTag = tag === "json" ? "textarea" : tag;
      return `
        <div class="field" style="margin-left: ${indent}px">
          <label>${name}:
          ${typeof tag === "string" ? `<${htmlTag} name="${prefix}${name}"></${htmlTag}>` : fieldsToHtml(tag, indent + 10, prefix + name + ".")}
          </label>
        </div>`;
    })
    .join("");
}

function getHtmlOperations() {
  return operations.map((operation) => {
    return `<li class="operation">
      <h3>${operation.name}</h3>
      <form class="operation-form">
        <input type="hidden" name="$endpoint" value="${operation.endpoint}" />
        <input type="hidden" name="$method" value="${operation.method}" />
        ${fieldsToHtml(operation.fields)}
        <button type="submit">Submit</button>
      </form>
    </li>`;
  });
}

function prefixedRecordIntoObject(record: Record<string, string>) {
  const obj: any = {}; // eslint-disable-line
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    const keys = key.split(".");
    const lastKey = keys.pop()!;
    let currentObj = obj;
    for (const key of keys) {
      if (!currentObj[key]) {
        currentObj[key] = {};
      }
      currentObj = currentObj[key];
    }
    currentObj[lastKey] = value;
  }
  return obj;
}

async function submitEventHandler(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const { $method, $endpoint, ...reqData } = Object.fromEntries(new FormData(form));

  // Replace :param with the actual value.
  const endpoint = ($endpoint as string).replace(/:(\w+)/g, (_, key) => {
    const param = reqData[key] as string;
    delete reqData[key];
    return param;
  });

  const op = operations.find((op) => op.endpoint === $endpoint && op.method === $method);
  const pairs = Object.entries(reqData);
  for (const [key, val] of pairs) {
    if (val === "") {
      delete reqData[key];
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const type = key.split(".").reduce((obj, key) => obj[key], op?.fields as any);
    if (type === "json") {
      reqData[key] = JSON.parse(val as string);
    }
  }

  const data = prefixedRecordIntoObject(reqData as Record<string, string>);

  updateResponse("", "Loading...");
  const response = await request($method as HttpMethod, endpoint as string, Object.keys(data).length > 0 ? data : undefined);
  updateResponse(response.$statusCode.toString(), JSON.stringify(response.$response, null, 2));
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#operations-list")!.innerHTML = getHtmlOperations().join("");
  document.querySelectorAll(".operation-form").forEach((form) => form.addEventListener("submit", submitEventHandler));
});
