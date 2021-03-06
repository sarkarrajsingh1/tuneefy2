<?php

namespace tuneefy\Platform\Platforms;

use tuneefy\MusicalEntity\Entities\AlbumEntity;
use tuneefy\MusicalEntity\Entities\TrackEntity;
use tuneefy\Platform\Platform;
use tuneefy\Platform\PlatformException;
use tuneefy\Platform\PlatformResult;
use tuneefy\Platform\WebStreamingPlatformInterface;

class MixcloudPlatform extends Platform implements WebStreamingPlatformInterface
{
    const NAME = 'Mixcloud';
    const HOMEPAGE = 'https://www.mixcloud.com/';
    const TAG = 'mixcloud';
    const COLOR = 'afd8db';

    const API_ENDPOINT = 'http://api.mixcloud.com/';
    const API_METHOD = Platform::METHOD_GET;

    protected $endpoints = [
        Platform::LOOKUP_TRACK => self::API_ENDPOINT.'%s',
        Platform::LOOKUP_ALBUM => null,
        Platform::LOOKUP_ARTIST => self::API_ENDPOINT.'%s',
        Platform::SEARCH_TRACK => self::API_ENDPOINT.'search',
        Platform::SEARCH_ALBUM => null,
       // Platform::SEARCH_ARTIST => self::API_ENDPOINT . "search"
    ];
    protected $terms = [
        Platform::LOOKUP_TRACK => null,
        Platform::LOOKUP_ALBUM => null,
        Platform::LOOKUP_ARTIST => null,
        Platform::SEARCH_TRACK => 'q',
        Platform::SEARCH_ALBUM => null,
       // Platform::SEARCH_ARTIST => "q" // Search for a user, in fact
    ];
    protected $options = [
        Platform::LOOKUP_TRACK => [],
        Platform::LOOKUP_ALBUM => [],
        Platform::LOOKUP_ARTIST => [],
        Platform::SEARCH_TRACK => ['type' => 'cloudcast', 'limit' => Platform::LIMIT],
        Platform::SEARCH_ALBUM => [],
       // Platform::SEARCH_ARTIST => Map { "type" => "user", "limit" => Platform::LIMIT }
    ];

    // https://www.mixcloud.com/aphex-twin/
    const REGEX_MIXCLOUD_ARTIST = "/mixcloud\.com\/(?P<artist_slug>".Platform::REGEX_FULLSTRING.")[\/]?$/";

    // https://www.mixcloud.com/LeFtOoO/678-new-section-boyz-onra-romare-drake-roman-rauch-clap-clap/
    const REGEX_MIXCLOUD_TRACK = "/mixcloud\.com\/(?P<artist_slug>".Platform::REGEX_FULLSTRING.")\/(?P<track_long_slug>".Platform::REGEX_FULLSTRING."\/".Platform::REGEX_FULLSTRING.")[\/]?$/";

    public function hasPermalink(string $permalink): bool
    {
        return strpos($permalink, 'mixcloud.') !== false;
    }

    public function expandPermalink(string $permalink, int $mode): PlatformResult
    {
        $musical_entity = null;
        $query_words = [$permalink];

        $match = [];

        if (preg_match(self::REGEX_MIXCLOUD_TRACK, $permalink, $match)) {
            $response = self::fetch($this, Platform::LOOKUP_TRACK, $match['artist_slug'].'/'.$match['track_long_slug']);

            if ($response === null || property_exists($response->data, 'error')) {
                throw new PlatformException($this);
            }

            $entity = $response->data;

            $musical_entity = new TrackEntity($entity->name, new AlbumEntity('', $entity->user->name, ''));
            $musical_entity->addLink(static::TAG, $entity->url);

            $query_words = [
                $musical_entity->getAlbum()->getArtist(),
                $musical_entity->getSafeTitle(),
            ];
        } elseif (preg_match(self::REGEX_MIXCLOUD_ARTIST, $permalink, $match)) {
            $response = self::fetch($this, Platform::LOOKUP_ARTIST, $match['artist_slug']);

            if ($response === null || property_exists($response->data, 'error')) {
                throw new PlatformException($this);
            }

            $query_words = [$response->data->name];
        }

        // Consolidate results
        $metadata = ['query_words' => $query_words];

        if ($musical_entity !== null) {
            $metadata['platform'] = $this->getName();
        }

        return new PlatformResult($metadata, $musical_entity);
    }

    public function extractSearchResults(\stdClass $response, int $type, string $query, int $limit, int $mode): array
    {
        return [];
        /*
          Below is the actual working code, but it seems unlikely that we're going
          to use it since we search "mixes" by "users" and not real tracks from
          artists. So this doesn't really make sense to merge that with any of
          the other results from the other platforms, I guess.
          Still, the following works perfectly.
        */
        // $response = await self::fetch($this, $type, $query);

        // if ($response === null || count($response->data->data) === 0) {
        //   return null;
        // }
        // $entities = $response->data->data;

        // // We actually don't pass the limit to the fetch()
        // // request since it's not really useful, in fact
        // $length = min(count($entities), $limit?$limit:Platform::LIMIT);

        // $musical_entities = [];

        // // Tracks bear a "play_count" score
        // // that we're using to rate the results
        // $max_play_count = 1;
        // if ($type === Platform::SEARCH_TRACK) {
        //   $max_play_count = max(intval($entities[0]->play_count),1);
        // }

        // // Normalizing each track found
        // for($i=0; $i<$length; $i++){

        //   $current_item = $entities[$i];

        //   if ($type === Platform::SEARCH_TRACK) {

        //     $musical_entity = new TrackEntity($current_item->name, new AlbumEntity("", $current_item->user->name, $current_item->pictures->large));
        //     $musical_entity->addLink(static::TAG, $current_item->url);

        //     $musical_entities->add(new PlatformResult(Map {"score" => $current_item->play_count/$max_play_count}, $musical_entity));

        //   }

        // }

        // return $musical_entities;
    }
}
