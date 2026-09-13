from sqlalchemy.orm import Session

from . import models

SEED_MODULES = [
    {
        "id": "python",
        "name": "Python",
        "description": "De cero a scripts, POO y estructuras de datos.",
        "topics": [
            ("basico", "Sintaxis básica"),
            ("poo", "Programación orientada a objetos"),
            ("estructuras", "Listas, dicts y sets"),
            ("funcional", "Funciones y decoradores"),
        ],
    },
    {
        "id": "javascript",
        "name": "JavaScript",
        "description": "Fundamentos del lenguaje del navegador y Node.js.",
        "topics": [
            ("basico", "Variables y funciones"),
            ("async", "Promesas y async/await"),
            ("dom", "Manipulación del DOM"),
            ("arrays", "Arrays y métodos de orden superior"),
        ],
    },
    {
        "id": "typescript",
        "name": "TypeScript",
        "description": "Tipado estático sobre JavaScript.",
        "topics": [
            ("tipos", "Tipos básicos e interfaces"),
            ("genericos", "Genéricos"),
            ("utility", "Utility types"),
        ],
    },
    {
        "id": "go",
        "name": "Go",
        "description": "Concurrencia simple y binarios rápidos.",
        "topics": [
            ("basico", "Sintaxis y tipos"),
            ("goroutines", "Goroutines y channels"),
            ("interfaces", "Interfaces"),
        ],
    },
    {
        "id": "rust",
        "name": "Rust",
        "description": "Seguridad de memoria sin garbage collector.",
        "topics": [
            ("ownership", "Ownership y borrowing"),
            ("basico", "Sintaxis básica"),
            ("traits", "Traits y generics"),
        ],
    },
    {
        "id": "java",
        "name": "Java",
        "description": "POO clásica y ecosistema empresarial.",
        "topics": [
            ("poo", "Clases y objetos"),
            ("colecciones", "Colecciones"),
            ("streams", "Streams y lambdas"),
        ],
    },
]


def seed_modules(db: Session) -> None:
    """Inserta módulos y topics si todavía no existen. Es idempotente:
    se puede llamar en cada arranque sin duplicar datos."""
    for order, data in enumerate(SEED_MODULES):
        module = db.query(models.Module).filter(models.Module.id == data["id"]).first()
        if module is None:
            module = models.Module(
                id=data["id"],
                name=data["name"],
                description=data["description"],
                order=order,
            )
            db.add(module)
            db.flush()
        else:
            module.name = data["name"]
            module.description = data["description"]
            module.order = order

        for t_order, (key, name) in enumerate(data["topics"]):
            topic = (
                db.query(models.Topic)
                .filter(models.Topic.module_id == module.id, models.Topic.key == key)
                .first()
            )
            if topic is None:
                db.add(
                    models.Topic(module_id=module.id, key=key, name=name, order=t_order)
                )
            else:
                topic.name = name
                topic.order = t_order

    db.commit()
