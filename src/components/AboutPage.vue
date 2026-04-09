<script setup lang="ts">
</script>

<template>
  <div class="about">
    <h2>Om To terninger</h2>
    <p class="intro">
      En enkel terning-app laget for brettspill, spesielt Settlers of Catan.
      Bruk den alene eller sammen med venner.
    </p>

    <section>
      <h3>Kaste terninger</h3>
      <p>Trykk hvor som helst på skjermen for å kaste. På mobil kan du også riste telefonen (slå på under Innstillinger).</p>
    </section>

    <section>
      <h3>Spillmoduser</h3>
      <ul>
        <li><strong>Vanlige terninger</strong> &mdash; Velg 1&ndash;6 terninger fritt.</li>
        <li><strong>Settlers of Catan</strong> &mdash; To terninger med stor sum-visning. Rød alarm og &laquo;Flytt r&oslash;veren!&raquo; n&aring;r du kaster 7.</li>
        <li><strong>Byer og Riddere</strong> &mdash; R&oslash;d og hvit terning pluss en hendelsesterning med barbarer og fremskritt (vitenskap, politikk, handel).</li>
      </ul>
    </section>

    <section>
      <h3>Statistikk</h3>
      <p>Alle kast logges med fordeling per sum, faktisk vs. forventet prosent, og historikk over de siste kastene. Appen varsler om uvanlige m&oslash;nstre, som tall som kommer mange ganger p&aring; rad.</p>
    </section>

    <section>
      <h3>Spill med flere</h3>
      <p>Trykk &laquo;Spill med flere&raquo; for &aring; opprette en flerbrukersesjon.</p>
      <ol>
        <li>Skriv inn navnet ditt og opprett spillet.</li>
        <li>Del lenken eller la andre skanne QR-koden.</li>
        <li>Endre rekkef&oslash;lge om &oslash;nsket og trykk &laquo;Start spill&raquo;.</li>
        <li>Spillerne kaster etter tur. Alle ser kastene i sanntid.</li>
      </ol>
      <p>Verten (den som opprettet) kan nullstille statistikk, starte p&aring; nytt og fjerne spillere som har forlatt.</p>
      <p>Det er en tidsfrist per tur (standard 30 sekunder, kan endres i Innstillinger). G&aring;r tiden ut hoppes spilleren over automatisk.</p>
    </section>

    <section>
      <h3>Utseende</h3>
      <p>Velg mellom lyst, m&oslash;rkt og neon-tema (80-talls retro) under Innstillinger.</p>
    </section>

    <section>
      <h3>Innstillinger</h3>
      <p>Du kan justere animasjonshastighet, lydeffekter, rist-funksjon og tid per tur. Alle innstillinger lagres lokalt i nettleseren.</p>
    </section>

    <footer class="about-footer">
      <p>toterninger.no</p>
    </footer>
  </div>
</template>

<style scoped>
.about {
  padding: 16px;
  max-width: 500px;
  margin: 0 auto;
}

h2 {
  font-size: 22px;
  margin: 0 0 8px;
  color: var(--text);
}

.intro {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0 0 20px;
  line-height: 1.5;
}

section {
  margin-bottom: 20px;
}

h3 {
  font-size: 16px;
  margin: 0 0 6px;
  color: var(--text);
}

p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 8px;
  line-height: 1.5;
}

ul, ol {
  margin: 6px 0 8px;
  padding-left: 20px;
}

li {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.about-footer {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
  text-align: center;
}

.about-footer p {
  font-size: 13px;
  color: var(--text-muted);
}
</style>
