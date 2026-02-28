export default function TenantPage({ params }: { params: { tenant: string } }) {
  return <div>Welcome to tenant: {params.tenant}</div>
}