import { useIsServiceRegistered } from "@/components/contexts/AssetsServiceContext";
import RegisterAudibleSource from "@/components/containers/register-audible-source";
import AudibleSource from "@/components/containers/audible-source";

export default function Audible() {
  const isServiceRegistered = useIsServiceRegistered("audible");

  if (isServiceRegistered) {
    return <AudibleSource />;
  } else {
    return <RegisterAudibleSource />;
  }
}
