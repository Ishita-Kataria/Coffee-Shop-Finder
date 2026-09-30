import { auth, signIn, signOut } from "@/auth"
import CafeMapWrapper from "@/components/CafeMapWrapper"
import FavoritesList from "@/components/FavoritesList"

export default async function Home() {
  const session = await auth()

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1>☕ Coffee Shop Finder</h1>

      {session?.user ? (
        <div>
          <p>Logged in as: {session.user.name} ({session.user.email})</p>
          <form
            action={async () => {
              "use server"
              await signOut()
            }}
          >
            <button type="submit">Sign Out</button>
          </form>
        </div>
      ) : (
        <div>
          <p>You are not logged in.</p>
          <form
            action={async () => {
              "use server"
              await signIn("github")
            }}
          >
            <button type="submit">Sign in with GitHub</button>
          </form>
          <form
            action={async () => {
              "use server"
              await signIn("google")
            }}
          >
            <button type="submit">Sign in with Google</button>
          </form>
        </div>
      )}

      <div style={{ marginTop: "30px" }}>
        <CafeMapWrapper />
      </div>

      {session?.user && (
        <div style={{ marginTop: "30px" }}>
          <FavoritesList />
        </div>
      )}
    </div>
  )
}