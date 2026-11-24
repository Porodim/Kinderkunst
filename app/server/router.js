// Sehr kleiner Router: Muster wie "/api/medien/:id/datei".

export function erzeugeRouter() {
  const routen = [];

  function neu(methode, muster, handler) {
    const namen = [];
    const quelle = muster.replace(/:(\w+)/g, (_, name) => {
      namen.push(name);
      return '([^/]+)';
    });
    routen.push({ methode, regex: new RegExp(`^${quelle}$`), namen, handler });
  }

  // Liefert { handler, params }, { nichtErlaubt: true } oder null.
  function finde(methode, pfad) {
    let pfadPasst = false;
    for (const route of routen) {
      const treffer = route.regex.exec(pfad);
      if (!treffer) continue;
      pfadPasst = true;
      if (route.methode !== methode) continue;
      const params = {};
      route.namen.forEach((name, i) => (params[name] = decodeURIComponent(treffer[i + 1])));
      return { handler: route.handler, params };
    }
    return pfadPasst ? { nichtErlaubt: true } : null;
  }

  return {
    get: (muster, handler) => neu('GET', muster, handler),
    post: (muster, handler) => neu('POST', muster, handler),
    finde,
  };
}
