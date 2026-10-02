import Simulator from "./simulator";
export default function Lab() {
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">LABORATOIRE · DONNÉES FICTIVES</p>
        <h1>
          Tester les règles,
          <br />
          <em>avant de les appliquer.</em>
        </h1>
        <p className="lead">
          Ce simulateur utilise le moteur financier partagé. Il reste en mémoire
          dans cet onglet et ne modifie aucune donnée réelle.
        </p>
      </div>
      <Simulator />
    </>
  );
}
