import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-[calc(100vh-57px)] flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
          },
        }}
      />
    </div>
  );
}
