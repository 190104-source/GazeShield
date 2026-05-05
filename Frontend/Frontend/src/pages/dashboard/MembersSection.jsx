import { useEffect, useState } from "react";
import { api } from "../../api/api";

export default function MembersSection({ selectedUsers, setSelectedUsers }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users/users/"); // Updated endpoint
        setUsers(res.data || []);
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };

    fetchUsers();
  }, []);

  const toggleUser = (user) => {
    const exists = selectedUsers.some((u) => u.email === user.email);
    if (exists) {
      setSelectedUsers(selectedUsers.filter((u) => u.email !== user.email));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const filteredUsers = users.filter((u) => {
    const searchText = search.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(searchText)) ||
      (u.email && u.email.toLowerCase().includes(searchText))
    );
  });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Members</h2>

      <input
        type="text"
        placeholder="Search by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 px-3 py-2 rounded border text-black"
      />

      {filteredUsers.length === 0 && (
        <p className="text-sm text-gray-400">No users found</p>
      )}

      <div className="space-y-2 max-h-[420px] overflow-y-auto">
        {filteredUsers.map((user) => {
          const selected = selectedUsers.some((u) => u.email === user.email);

          return (
            <div
              key={user.email}
              onClick={() => toggleUser(user)}
              className={`p-3 rounded border cursor-pointer flex justify-between ${
                selected
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-black"
              }`}
            >
              <div>
                <p className="font-semibold">
                  {user.name || user.email.split("@")[0]}
                </p>
                <p className="text-xs opacity-70">{user.email}</p>
              </div>

              {selected && <span className="font-bold">✔</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}