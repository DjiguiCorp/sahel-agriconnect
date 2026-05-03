import { useState } from 'react';
import { Mail, Smartphone, CheckCircle } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    role: 'agriculteur',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Données soumises:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        nom: '',
        email: '',
        role: 'agriculteur',
        message: '',
      });
    }, 3000);
  };

  const inputFocus = 'focus:ring-2 focus:ring-brand-sage focus:border-transparent';

  return (
    <div>
      <section className="bg-gradient-to-br from-brand-forest to-brand-sage text-white py-12">
        <div className="section-container text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Contact / Inscription</h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Rejoignez le projet PTASS et participez à la transformation de l&apos;agriculture en Afrique de l&apos;Ouest et
            au-delà
          </p>
        </div>
      </section>

      <section className="section-container py-16">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <h2 className="text-2xl font-bold text-brand-forest mb-6">Formulaire d&apos;inscription</h2>

            {submitted && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-brand-sage rounded text-brand-forest">
                <p className="font-semibold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 shrink-0 text-brand-sage" aria-hidden />
                  Inscription réussie !
                </p>
                <p className="text-sm mt-1">Merci pour votre intérêt. Nous vous contacterons sous peu.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  required
                  value={formData.nom}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg ${inputFocus}`}
                  placeholder="Votre nom complet"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg ${inputFocus}`}
                  placeholder="votre.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle *
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg ${inputFocus}`}
                >
                  <option value="agriculteur">Agriculteur</option>
                  <option value="cooperative">Coopérative</option>
                  <option value="investisseur">Investisseur</option>
                  <option value="partenaire">Partenaire technique</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message (optionnel)
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="4"
                  value={formData.message}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg ${inputFocus}`}
                  placeholder="Dites-nous en plus sur votre projet ou vos besoins..."
                />
              </div>

              <button type="submit" className="w-full btn-primary">
                Envoyer l&apos;inscription
              </button>
            </form>
          </div>

          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-xl font-semibold text-brand-forest mb-4 flex items-center gap-2">
                <Mail className="w-6 h-6 text-brand-sage shrink-0" aria-hidden />
                Contact email
              </h3>
              <p className="text-gray-600">Pour toute question, contactez-nous à :</p>
              <a
                href="mailto:contact@sahelagriconnect.org"
                className="text-brand-sage hover:text-brand-forest font-medium mt-2 inline-block"
              >
                contact@sahelagriconnect.org
              </a>
            </div>

            <div className="card">
              <h3 className="text-xl font-semibold text-brand-forest mb-4 flex items-center gap-2">
                <Smartphone className="w-6 h-6 text-brand-sage shrink-0" aria-hidden />
                Application mobile
              </h3>
              <p className="text-gray-600 mb-4">
                Téléchargez notre application pour accéder à toutes les fonctionnalités :
              </p>
              <a
                href="#"
                className="btn-secondary inline-block"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Application mobile bientôt disponible !');
                }}
              >
                Télécharger l&apos;app
              </a>
            </div>
          </div>

          <div className="mt-12 card bg-gradient-to-br from-brand-forest to-brand-sage text-white">
            <h3 className="text-2xl font-semibold mb-4">Zones d&apos;intervention</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Sénégal</h4>
                <ul className="text-white/90 text-sm space-y-1">
                  <li>• Dakar</li>
                  <li>• Thiès</li>
                  <li>• Kaolack</li>
                  <li>• Saint-Louis</li>
                  <li>• Ziguinchor</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Côte d&apos;Ivoire</h4>
                <ul className="text-white/90 text-sm space-y-1">
                  <li>• Abidjan</li>
                  <li>• Bouaké</li>
                  <li>• Korhogo</li>
                  <li>• San-Pédro</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Ghana</h4>
                <ul className="text-white/90 text-sm space-y-1">
                  <li>• Accra</li>
                  <li>• Kumasi</li>
                  <li>• Tamale</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
