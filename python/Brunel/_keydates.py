
from ._keydate import KeyDate as _KeyDate

__all__ = ["KeyDates"]


def _generate_source_uid():
    import uuid as _uuid
    uid = _uuid.uuid4()
    return "K" + str(uid)[:7]


class KeyDates:
    """This holds a registry of key dates in the project"""
    def __init__(self, props=None, getHook=None):
        self._getHook = getHook

        self.state = {
            "registry": {},
        }

        self._names = {}

        self.load(props)

    def add(self, date: _KeyDate):
        if date is None:
            return None

        if isinstance(date, str):
            if len(date) == 0:
                return None

            # Try to find an existing project with this name
            try:
                return self.getByName(date)
            except Exception:
                return self.add(_KeyDate({"name": date}))

        if not isinstance(date, _KeyDate):
            raise TypeError("Can only add a KeyDate to KeyDates")

        existing = None

        try:
            existing = self.getByName(date.getName())
        except Exception:
            pass

        if existing:
            existing = existing.merge(date)
            self.state["registry"][existing.getID()] = existing
            return existing

        id = date.getID()

        if id:
            if id in self.state["registry"]:
                raise KeyError(f"Duplicate Project ID {date}")

            self.state["registry"][id] = date
        else:
            uid = _generate_source_uid()

            while uid in self.state["registry"]:
                uid = _generate_source_uid()

            date.state["id"] = uid
            self.state["registry"][uid] = date

        date._getHook = self._getHook
        self._names[date.getName()] = date.getID()
        return date

    def getByName(self, name):
        try:
            return self.get(self._names[name])
        except Exception:
            raise KeyError(f"No Source with name {name}")

    def find(self, value):
        if isinstance(value, _KeyDate):
            return self.get(value.getID())

        value = value.lstrip().rstrip().lower()

        results = []

        for name in self._names.keys():
            if name.lower().find(value) != -1:
                results.append(self.get(self._names[name]))

        if len(results) == 1:
            return results[0]
        elif len(results) > 1:
            return results

        keys = "', '".join(self._names.keys())

        raise KeyError(f"No key date matches '{value}'. Available key dates are '{keys}'")

    def get(self, id):
        try:
            return self.state["registry"][id]
        except Exception:
            raise KeyError(f"No Note with ID {id}")

    def registry(self):
        """ Return this objects registry

            Returns:
                dict: Dictionary of projects
        """
        return self.state["registry"]

    def load(self, data):
        """ Add to registry

            Args:
                data: Data from which to create project
            Returns:
                None
        """
        if data:
            for item in data:
                note = _KeyDate.load(item)
                self.add(note)

    def toDry(self):
        return self.state

    @staticmethod
    def unDry(value):
        dates = KeyDates()
        dates.state = value

        return dates
