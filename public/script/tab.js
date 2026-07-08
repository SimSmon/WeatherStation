// ==============================
// Tab
// ==============================


// Logique de basculement des onglets
    function switchTab(event, tabName) {
      // 1. On cache toutes les sections
      const contents = document.querySelectorAll('.tab-content');
      contents.forEach(content => content.classList.add('hidden'));

      // 2. On désactive tous les boutons
      const buttons = document.querySelectorAll('.tab-btn');
      buttons.forEach(btn => btn.classList.remove('active'));

      // 3. On affiche la section demandée
      document.getElementById('tab-' + tabName).classList.remove('hidden');

      // 4. On active le bouton sur lequel on a cliqué
      event.currentTarget.classList.add('active');

      // (Optionnel) Ici, on pourra lancer une fonction fetch spécifique selon l'onglet cliqué
      if (tabName === 'charts') {
        console.log("Lancement du chargement des graphiques...");
      }
    }
