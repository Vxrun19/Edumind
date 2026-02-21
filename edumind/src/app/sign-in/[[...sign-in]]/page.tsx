import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-[calc(100vh-57px)] flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
          },
        }}
      />
    </div>
  );
}
