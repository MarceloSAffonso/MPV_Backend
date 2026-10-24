from locust import HttpUser, between, task

class Visitante(HttpUser):
    wait_time = between(0.5, 2)

    @task(5)
    def lista_atracoes(self):
        with self.client.get("/api/attractions", name="GET /api/attractions", catch_response=True) as r:
            if r.elapsed.total_seconds() > 2:
                r.failure("lista de atrações acima de 2 s (RNF04)")

    @task(3)
    def detalhe_atracao(self):
        self.client.get("/api/attractions/pedra-do-sino", name="GET /api/attractions/:slug")

    @task(3)
    def eventos(self):
        self.client.get("/api/events", name="GET /api/events")

    @task(2)
    def avisos(self):
        self.client.get("/api/notices", name="GET /api/notices")

    @task(1)
    def pagina_inicial(self):
        self.client.get("/", name="GET / (SPA)")
