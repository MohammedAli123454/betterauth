import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div style={{ maxWidth: '480px', margin: '120px auto', padding: '24px' }}>
      <h1 style={{ marginBottom: '12px' }}>Registration Disabled</h1>
      <p style={{ color: '#555', marginBottom: '20px', lineHeight: 1.6 }}>
        Self-service account creation is not available. If you need access,
        please contact an administrator so they can provision an account and
        assign the proper role.
      </p>
      <Link
        href="/login"
        style={{
          display: 'inline-block',
          padding: '10px 20px',
          backgroundColor: '#0070f3',
          color: '#fff',
          borderRadius: '4px',
          textDecoration: 'none',
        }}
      >
        Back to sign in
      </Link>
    </div>
  );
}
