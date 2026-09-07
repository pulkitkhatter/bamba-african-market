import { useEffect, useState, type FormEvent } from "react";
import { api, type StaffMember } from "../../lib/api";

export function StaffPanel() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    api
      .getStaff()
      .then(setStaff)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.createStaff({ email, password });
      setEmail("");
      setPassword("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create employee login.");
    }
  }

  async function handleDelete(member: StaffMember) {
    if (!confirm(`Remove employee login for ${member.email}?`)) return;
    await api.deleteStaff(member.id);
    load();
  }

  if (loading) return <p>Loading staff…</p>;

  return (
    <div>
      <p className="admin-hint">
        Employee logins can only see and complete orders — they can't edit products,
        categories, settings, or other staff.
      </p>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {staff.map((member) => (
            <tr key={member.id}>
              <td>{member.email}</td>
              <td>{member.role === "ADMIN" ? "Admin" : "Employee"}</td>
              <td>
                {member.role === "EMPLOYEE" && (
                  <button
                    type="button"
                    className="btn btn-outline btn-small"
                    onClick={() => handleDelete(member)}
                  >
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form onSubmit={handleAdd} className="admin-inline-form">
        <input
          type="email"
          placeholder="Employee email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <button type="submit" className="btn btn-small">
          Add Employee
        </button>
      </form>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
