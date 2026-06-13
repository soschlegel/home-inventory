import { Navigate, useParams } from 'react-router-dom';

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/instances/${id}`} replace />;
}
