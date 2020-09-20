'use strict';

const citySelect = document.getElementById('select-cities'),
  closeBtn = document.querySelector('.close-button'),
  linkBtn = document.querySelector('.input-cities .button'),
  dropdown = document.querySelector('.dropdown'),
  defaultList = dropdown.querySelector('.dropdown-lists__list--default'),
  selectList = dropdown.querySelector('.dropdown-lists__list--select'),
  autocompleteList = dropdown.querySelector('.dropdown-lists__list--autocomplete'),
  lineTemplate = document.querySelector('.js-line'),
  totalLineTemplate = document.querySelector('.js-total-line'),
  preloaderTemplate = document.querySelector('.js-preloader');

const animate = ({ draw, duration }) => {
  const start = performance.now();

  requestAnimationFrame(function animate(time) {
    let timeFraction = (time - start) / duration;
    if (timeFraction > 1) timeFraction = 1;

    const progress = timeFraction;

    draw(progress);

    if (timeFraction < 1) {
      requestAnimationFrame(animate);
    }
  });
};

const sortByCount = cities => cities.sort((a, b) => b.count - a.count);

const getTop3Cities = cities => {
  sortByCount(cities);

  return cities.slice(0, 3);
};

const getAllCities = data => {
  let allCities = [];

  data.forEach(({ country, cities }) => {
    cities.forEach(({ name, count }) => {
      allCities = [...allCities, { name, count, country }];
    });
  });

  return allCities;
};

const getFoundCities = (cities, searchString) => {
  return cities.filter(city => {
    const cityName = city.name.toLowerCase();
    return cityName.indexOf(searchString.toLowerCase()) === 0;
  });
};

const highlightLetters = letters => {
  const citiesLines = autocompleteList.querySelectorAll('.dropdown-lists__city');

  citiesLines.forEach(cityLine => {
    if (cityLine.classList.contains('dropdown-lists__line--error')) return;

    const cityName = cityLine.textContent,
      regExp = new RegExp(`${letters}`, 'gi');

    cityLine.innerHTML = cityName.replace(regExp, match => `<b>${match}</b>`);
  });
};

const renderFoundCities = (allCities, searchString) => {
  const foundCities = getFoundCities(allCities, searchString);

  addCountryBlock({ cities: foundCities }, lineTemplate, autocompleteList.querySelector('.dropdown-lists__col'));

  highlightLetters(searchString);
};

const addLine = (country, { name, count }, template, target) => {
  const line = template.content.cloneNode(true),
    lineCity = line.querySelector('.dropdown-lists__city'),
    lineCount = line.querySelector('.dropdown-lists__count');

  lineCity.parentNode.dataset.country = country;
  lineCity.parentNode.dataset.city = name;
  lineCity.textContent = name;
  lineCount.textContent = count;

  target.append(line);
};

const addTotalLine = ({ country, count }, template, target) => {
  const line = template.content.cloneNode(true),
    lineCountry = line.querySelector('.dropdown-lists__country'),
    lineCount = line.querySelector('.dropdown-lists__count');

  lineCountry.textContent = country;
  lineCount.textContent = count;

  target.append(line);
};

const addCountryBlock = ({ country, count, cities }, template, target) => {
  const countryBlock = document.createElement('div');
  countryBlock.classList.add('dropdown-lists__countryBlock');

  if (country && count) {
    countryBlock.dataset.country = country;
    addTotalLine({ country, count }, totalLineTemplate, countryBlock);
  }

  if (target.closest('.dropdown-lists__list--default')) {
    cities = getTop3Cities(cities);
  } else {
    target.textContent = '';
  }

  if (cities.length > 0) {
    cities.forEach(city => {
      const countryTemp = country ? country : city.country;
      addLine(countryTemp, city, lineTemplate, countryBlock);
    });
  } else {
    const errorLine = document.createElement('div');
    errorLine.className = 'dropdown-lists__line dropdown-lists__line--error';
    errorLine.textContent = 'Ничего не найдено :(';
    countryBlock.append(errorLine);
  }

  target.append(countryBlock);
};

const addPreloader = (template, target) => {
  const preloader = template.content.cloneNode(true),
    preloaderClassName = preloader.children[0].className;

  target.prepend(preloader);

  return target.querySelector('.'+ preloaderClassName);
};

const unshiftHomeland = (data, locale) => {
  const localData = data[locale];

  let country;
  switch (locale) {
    case 'RU':
      country = 'Россия';
      break;
    case 'EN':
      country = 'United Kingdom';
      break;
    case 'DE':
      country = 'Deutschland';
      break;
  }

  const indexOfCountry = localData.findIndex(item => item.country === country);

  const countryItem = localData[indexOfCountry];
  localData.splice(indexOfCountry, 1);
  localData.splice(0, 0, countryItem);

  return localData;
};

const getCitiesData = async (url, locale = 'RU') => {
  const dropdownPreloader = addPreloader(preloaderTemplate, dropdown);

  const response = await fetch(url);

  if (!response.ok) throw new Error(response.status);

  const data = await response.json();

  const localData = unshiftHomeland(data, locale);

  localData.forEach(country => {
    addCountryBlock(country, lineTemplate, defaultList.querySelector('.dropdown-lists__col'));
  });

  dropdownPreloader.remove();

  return localData;
};

citySelect.addEventListener('focus', () => {
  defaultList.style.display = '';
  autocompleteList.style.display = '';
});

closeBtn.addEventListener('click', () => {
  citySelect.value = '';
  closeBtn.style.display = '';
  linkBtn.removeAttribute('href');

  defaultList.style.display = 'none';
  selectList.style = '';
  autocompleteList.style.display = '';
});

let locale = prompt('Введите локаль (RU, EN, DE):');
while (locale !== 'RU' && locale !== 'EN' && locale !== 'DE') {
  alert('Ошибка ввода!');
  locale = prompt('Введите локаль (RU, EN, DE):');
}

getCitiesData('db_cities.json', locale)
  .then(data => {
    const allCities = getAllCities(data);

    dropdown.addEventListener('click', evt => {
      const target = evt.target;

      if (!target.closest('.dropdown-lists__countryBlock')) return;

      const targetCountry = target.closest('.dropdown-lists__countryBlock').dataset.country;

      if (target.closest('.dropdown-lists__total-line')) {
        citySelect.value = targetCountry;
        linkBtn.removeAttribute('href');

        // Если клик по стране из списка стран с топ3 городами, то в список со всеми городами выбранной страны добавляем инфу
        if (target.closest('.dropdown-lists__list--default')) {
          animate({
            duration: 150,
            draw(progress) {
              selectList.style.transform = `translateX(${100 - progress * 100}%)`;
              selectList.style.width = `${progress * 100}%`;
              selectList.style.opacity = `${progress * 100}%`;
            }
          });
          selectList.style.display = 'block';
          dropdown.scrollTop = 0;

          data.forEach(item => {
            if (item.country === targetCountry) {
              addCountryBlock(item, lineTemplate, selectList.querySelector('.dropdown-lists__col'));
            }
          });
        }

        // Если клик по стране из списка со всеми городами, то закрываем его
        if (target.closest('.dropdown-lists__list--select')) {
          animate({
            duration: 180,
            draw(progress) {
              selectList.style.transform = `translateX(${progress * 100}%)`;
              selectList.style.width = `${100 - progress * 100}%`;
              selectList.style.opacity = `${100 - progress * 100}%`;
            }
          });
        }

      } else if (target.closest('.dropdown-lists__line')) {
        const targetCountry = target.closest('.dropdown-lists__line').dataset.country,
          targetCity = target.closest('.dropdown-lists__line').dataset.city;

        const cityData = data.find(item => item.country === targetCountry)
          .cities.find(city => city.name === targetCity);

        citySelect.value = targetCity;
        linkBtn.href = cityData.link;

        if (target.closest('.dropdown-lists__list--autocomplete')) {
          renderFoundCities(allCities, citySelect.value);
        }
      }

      closeBtn.style.display = 'block';
    });

    citySelect.addEventListener('input', evt => {
      const target = evt.target;

      autocompleteList.style.display = 'block';
      defaultList.style.display = 'none';
      selectList.style.display = '';
      closeBtn.style.display = 'block';
      linkBtn.removeAttribute('href');

      if (target.value === '') {
        defaultList.style = '';
        selectList.style = '';
        autocompleteList.style.display = '';
        closeBtn.style.display = '';
      }

      renderFoundCities(allCities, target.value);
    });
  })
  .catch(err => console.error(err));
